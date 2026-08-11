import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { createChallanSchema } from "../validators";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";
import {
  createChallanWithItems,
  confirmChallanById,
  cancelChallanById,
} from "../services/challanService";

const CHALLAN_INCLUDE = {
  customer: { select: { id: true, name: true, businessName: true } },
  createdBy: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, sku: true, currentStock: true } },
    },
  },
} as const;

export const createChallan = async (req: AuthRequest, res: Response) => {
  const parsed = createChallanSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => { errors[e.path.join(".")] = e.message; });
    return errorResponse(res, "Validation failed", 400, errors);
  }

  try {
    const challan = await createChallanWithItems({
      ...parsed.data,
      createdById: req.user!.userId,
    });
    return successResponse(res, challan, "Challan created successfully", 201);
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg.startsWith("PRODUCT_NOT_FOUND")) {
      return errorResponse(res, "One or more products not found", 404);
    }
    if (msg.startsWith("INSUFFICIENT_STOCK")) {
      const [, name] = msg.split(":");
      return errorResponse(res, `Insufficient stock for ${name}`, 400);
    }
    console.error("[Challan] Create error:", err);
    return errorResponse(res, "Failed to create challan", 500);
  }
};

export const getChallans = async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const status = req.query.status as string | undefined;
  const customerId = req.query.customerId
    ? parseInt(req.query.customerId as string)
    : undefined;
  const search = (req.query.search as string) || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerId && !isNaN(customerId)) where.customerId = customerId;
  if (search) {
    where.OR = [
      { challanNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, challans] = await Promise.all([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
        items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
      },
    }),
  ]);

  return paginatedResponse(res, challans, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return errorResponse(res, "Invalid challan ID", 400);

  const challan = await prisma.challan.findUnique({
    where: { id },
    include: CHALLAN_INCLUDE,
  });

  if (!challan) return errorResponse(res, "Challan not found", 404);
  return successResponse(res, challan);
};

export const updateChallan = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return errorResponse(res, "Invalid challan ID", 400);

  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!challan) return errorResponse(res, "Challan not found", 404);
  if (challan.status !== "DRAFT") {
    return errorResponse(res, "Only DRAFT challans can be updated", 400);
  }

  const { customerId, items } = req.body as {
    customerId?: number;
    items?: Array<{ productId: number; quantity: number }>;
  };

  try {
    await prisma.$transaction(async (tx) => {
      if (items && items.length > 0) {
        // Delete existing items and recreate
        await tx.challanItem.deleteMany({ where: { challanId: id } });

        const productIds = items.map((i) => i.productId);
        const products = await tx.product.findMany({ where: { id: { in: productIds } } });
        const productMap = new Map(products.map((p) => [p.id, p]));

        const totalQty = items.reduce((s, i) => s + i.quantity, 0);

        await tx.challan.update({
          where: { id },
          data: {
            ...(customerId ? { customerId } : {}),
            totalQuantity: totalQty,
            items: {
              create: items.map((item) => {
                const product = productMap.get(item.productId);
                if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  productName: product.name,
                  sku: product.sku,
                  unitPrice: product.unitPrice,
                };
              }),
            },
          },
        });
      } else if (customerId) {
        await tx.challan.update({ where: { id }, data: { customerId } });
      }
    });

    const updated = await prisma.challan.findUnique({
      where: { id },
      include: CHALLAN_INCLUDE,
    });
    return successResponse(res, updated, "Challan updated successfully");
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg.startsWith("PRODUCT_NOT_FOUND")) {
      return errorResponse(res, "One or more products not found", 404);
    }
    console.error("[Challan] Update error:", err);
    return errorResponse(res, "Failed to update challan", 500);
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return errorResponse(res, "Invalid challan ID", 400);

  try {
    const challan = await confirmChallanById(id, req.user!.userId);
    return successResponse(res, challan, "Challan confirmed successfully");
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "CHALLAN_NOT_FOUND") return errorResponse(res, "Challan not found", 404);
    if (msg.startsWith("CHALLAN_NOT_DRAFT")) {
      const [, currentStatus] = msg.split(":");
      return errorResponse(
        res,
        `Challan cannot be confirmed — current status: ${currentStatus}`,
        400
      );
    }
    if (msg.startsWith("INSUFFICIENT_STOCK")) {
      const [, name] = msg.split(":");
      return errorResponse(res, `Insufficient stock for ${name}`, 400);
    }
    console.error("[Challan] Confirm error:", err);
    return errorResponse(res, "Failed to confirm challan", 500);
  }
};

export const cancelChallan = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return errorResponse(res, "Invalid challan ID", 400);

  try {
    const challan = await cancelChallanById(id);
    return successResponse(res, challan, "Challan cancelled successfully");
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "CHALLAN_NOT_FOUND") return errorResponse(res, "Challan not found", 404);
    if (msg === "CHALLAN_ALREADY_CANCELLED")
      return errorResponse(res, "Challan is already cancelled", 400);
    if (msg === "CHALLAN_ALREADY_CONFIRMED")
      return errorResponse(res, "Confirmed challans cannot be cancelled", 400);
    console.error("[Challan] Cancel error:", err);
    return errorResponse(res, "Failed to cancel challan", 500);
  }
};
