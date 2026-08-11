import { Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { createProductSchema, updateProductSchema } from "../validators";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";

export const createProduct = async (req: AuthRequest, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => { errors[e.path.join(".")] = e.message; });
    return errorResponse(res, "Validation failed", 400, errors);
  }

  const data = parsed.data;
  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitPrice: data.unitPrice,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
      warehouseLocation: data.warehouseLocation,
    },
  });

  return successResponse(res, {
    ...product,
    unitPrice: Number(product.unitPrice),
    isLowStock: product.currentStock <= product.minimumStock,
  }, "Product created successfully", 201);
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const search = (req.query.search as string) || "";
  const category = req.query.category as string | undefined;
  const lowStock = req.query.lowStock === "true";

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { sku: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { category: { contains: search, mode: Prisma.QueryMode.insensitive } },
    ];
  }
  if (category) {
    where.category = { equals: category, mode: Prisma.QueryMode.insensitive };
  }

  const [allProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
    }),
  ]);

  // Apply low-stock filter in memory (field-to-field comparison)
  const filtered = lowStock
    ? allProducts.filter((p) => p.currentStock <= p.minimumStock)
    : allProducts;

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const enriched = paginated.map((p) => ({
    ...p,
    unitPrice: Number(p.unitPrice),
    isLowStock: p.currentStock <= p.minimumStock,
  }));

  return paginatedResponse(res, enriched, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return errorResponse(res, "Invalid product ID", 400);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return errorResponse(res, "Product not found", 404);

  return successResponse(res, {
    ...product,
    unitPrice: Number(product.unitPrice),
    isLowStock: product.currentStock <= product.minimumStock,
  });
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return errorResponse(res, "Invalid product ID", 400);

  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => { errors[e.path.join(".")] = e.message; });
    return errorResponse(res, "Validation failed", 400, errors);
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return errorResponse(res, "Product not found", 404);

  const data = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
      ...(data.currentStock !== undefined && { currentStock: data.currentStock }),
      ...(data.minimumStock !== undefined && { minimumStock: data.minimumStock }),
      ...(data.warehouseLocation !== undefined && { warehouseLocation: data.warehouseLocation }),
    },
  });

  return successResponse(res, {
    ...product,
    unitPrice: Number(product.unitPrice),
    isLowStock: product.currentStock <= product.minimumStock,
  }, "Product updated successfully");
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return errorResponse(res, "Invalid product ID", 400);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return errorResponse(res, "Product not found", 404);

  await prisma.product.delete({ where: { id } });
  return successResponse(res, null, "Product deleted successfully");
};

export const getCategories = async (_req: AuthRequest, res: Response) => {
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return successResponse(res, categories.map((c) => c.category));
};
