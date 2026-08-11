import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { createStockMovementSchema } from "../validators";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";

export const getStockOverview = async (_req: AuthRequest, res: Response) => {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      currentStock: true,
      minimumStock: true,
      warehouseLocation: true,
      unitPrice: true,
    },
  });

  const enriched = products.map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    isLowStock: p.currentStock <= p.minimumStock,
  }));

  return successResponse(res, enriched, "Stock overview fetched");
};

export const getStockMovements = async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const productId = req.query.productId
    ? parseInt(req.query.productId as string)
    : undefined;
  const movementType = req.query.type as string | undefined;

  const where: Record<string, unknown> = {};
  if (productId && !isNaN(productId)) where.productId = productId;
  if (movementType === "IN" || movementType === "OUT") where.movementType = movementType;

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
  ]);

  return paginatedResponse(res, movements, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const createStockMovement = async (req: AuthRequest, res: Response) => {
  const parsed = createStockMovementSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => { errors[e.path.join(".")] = e.message; });
    return errorResponse(res, "Validation failed", 400, errors);
  }

  const { productId, quantity, movementType, reason } = parsed.data;

  try {
    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      if (movementType === "OUT") {
        if (product.currentStock < quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
      }

      const newStock =
        movementType === "IN"
          ? product.currentStock + quantity
          : product.currentStock - quantity;

      const [updatedProduct, movement] = await Promise.all([
        tx.product.update({
          where: { id: productId },
          data: { currentStock: newStock },
        }),
        tx.stockMovement.create({
          data: {
            productId,
            quantity,
            movementType,
            reason,
            createdById: req.user!.userId,
          },
          include: {
            product: { select: { id: true, name: true, sku: true } },
            createdBy: { select: { id: true, name: true } },
          },
        }),
      ]);

      return { movement, updatedProduct: { ...updatedProduct, currentStock: updatedProduct.currentStock } };
    });

    return successResponse(res, result, "Stock movement recorded successfully", 201);
  } catch (err: unknown) {
    const msg = (err as Error).message;
    if (msg === "PRODUCT_NOT_FOUND") return errorResponse(res, "Product not found", 404);
    if (msg.startsWith("INSUFFICIENT_STOCK")) {
      const [, name] = msg.split(":");
      return errorResponse(res, `Insufficient stock for ${name}`, 400);
    }
    console.error("[Stock] Movement error:", err);
    return errorResponse(res, "Failed to record stock movement", 500);
  }
};
