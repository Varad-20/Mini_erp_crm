import { prisma } from "../config/prisma";
import { generateChallanNumber } from "../utils/challanNumber";

interface ChallanItemInput {
  productId: number;
  quantity: number;
}

interface CreateChallanInput {
  customerId: number;
  items: ChallanItemInput[];
  status: "DRAFT" | "CONFIRMED";
  createdById: number;
}

/**
 * Creates a challan.
 * - If status is DRAFT: saves items with product snapshot, does NOT touch stock.
 * - If status is CONFIRMED: saves items AND atomically deducts stock + creates OUT movements.
 */
export const createChallanWithItems = async (input: CreateChallanInput) => {
  const challanNumber = await generateChallanNumber();

  // Fetch product details for snapshot
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate all products exist
  for (const item of input.items) {
    if (!productMap.has(item.productId)) {
      throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
    }
  }

  const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);

  if (input.status === "DRAFT") {
    // Create challan + items — no stock changes
    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        totalQuantity,
        status: "DRAFT",
        createdById: input.createdById,
        items: {
          create: input.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              productName: product.name,
              sku: product.sku,
              unitPrice: Number(product.unitPrice),
            };
          }),
        },
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return challan;
  }

  // CONFIRMED — atomic transaction: validate stock, deduct, create movements
  return await prisma.$transaction(async (tx) => {
    // Re-read products inside transaction for accurate stock
    const freshProducts = await tx.product.findMany({
      where: { id: { in: productIds } },
    });
    const freshMap = new Map(freshProducts.map((p) => [p.id, p]));

    // Check stock for every item BEFORE modifying anything
    for (const item of input.items) {
      const product = freshMap.get(item.productId);
      if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
      if (product.currentStock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.currentStock}:${item.quantity}`);
      }
    }

    // Create the challan
    const challan = await tx.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        totalQuantity,
        status: "CONFIRMED",
        createdById: input.createdById,
        items: {
          create: input.items.map((item) => {
            const product = freshMap.get(item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              productName: product.name,
              sku: product.sku,
              unitPrice: Number(product.unitPrice),
            };
          }),
        },
      },
      include: {
        items: true,
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Deduct stock and create OUT movements for each item
    for (const item of input.items) {
      const product = freshMap.get(item.productId)!;
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: "OUT",
          reason: `Sales Challan ${challanNumber}`,
          createdById: input.createdById,
        },
      });
      // Safety check: stock must never go negative
      const updated = await tx.product.findUnique({ where: { id: item.productId } });
      if (updated && updated.currentStock < 0) {
        throw new Error(`NEGATIVE_STOCK:${product.name}`);
      }
    }

    return challan;
  });
};

/**
 * Confirms a DRAFT challan atomically.
 * Validates stock → deducts → creates OUT movements → updates status.
 * ALL steps happen in one transaction. If any step fails, nothing is committed.
 */
export const confirmChallanById = async (challanId: number, confirmedByUserId: number) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Load challan with items
    const challan = await tx.challan.findUnique({
      where: { id: challanId },
      include: { items: true },
    });

    if (!challan) throw new Error("CHALLAN_NOT_FOUND");
    if (challan.status !== "DRAFT") throw new Error(`CHALLAN_NOT_DRAFT:${challan.status}`);

    // 2. Load fresh stock for all products
    const productIds = challan.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. Validate EVERY item's stock before modifying anything
    for (const item of challan.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
      if (product.currentStock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${item.productName}:${product.currentStock}:${item.quantity}`);
      }
    }

    // 4. All stock checks passed — now deduct and create movements
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          movementType: "OUT",
          reason: `Sales Challan ${challan.challanNumber}`,
          createdById: confirmedByUserId,
        },
      });
    }

    // 5. Update challan status to CONFIRMED
    const updated = await tx.challan.update({
      where: { id: challanId },
      data: { status: "CONFIRMED" },
      include: {
        items: true,
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return updated;
  });
};

/**
 * Cancels a challan. Only DRAFT challans can be cancelled.
 * CONFIRMED challans cannot be cancelled (stock has already been deducted).
 */
export const cancelChallanById = async (challanId: number) => {
  const challan = await prisma.challan.findUnique({ where: { id: challanId } });
  if (!challan) throw new Error("CHALLAN_NOT_FOUND");
  if (challan.status === "CANCELLED") throw new Error("CHALLAN_ALREADY_CANCELLED");
  if (challan.status === "CONFIRMED") throw new Error("CHALLAN_ALREADY_CONFIRMED");

  return await prisma.challan.update({
    where: { id: challanId },
    data: { status: "CANCELLED" },
    include: {
      items: true,
      customer: { select: { id: true, name: true, businessName: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
};
