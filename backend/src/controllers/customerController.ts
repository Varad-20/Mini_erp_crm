import { Response } from "express";
import { Prisma } from "../generated/prisma";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
} from "../validators";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";

export const createCustomer = async (req: AuthRequest, res: Response) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => { errors[e.path.join(".")] = e.message; });
    return errorResponse(res, "Validation failed", 400, errors);
  }

  const data = parsed.data;
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email || null,
      businessName: data.businessName,
      gstNumber: data.gstNumber || null,
      customerType: data.customerType,
      address: data.address,
      status: data.status,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      notes: data.notes || null,
      createdById: req.user!.userId,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  return successResponse(res, customer, "Customer created successfully", 201);
};

export const getCustomers = async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const search = (req.query.search as string) || "";
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;

  const where: Prisma.CustomerWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { businessName: { contains: search } },
      { mobile: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (status) where.status = status as Prisma.CustomerWhereInput["status"];
  if (type) where.customerType = type as Prisma.CustomerWhereInput["customerType"];

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    }),
  ]);

  return paginatedResponse(res, customers, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (!id) return errorResponse(res, "Invalid customer ID", 400);

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      followUps: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });

  if (!customer) return errorResponse(res, "Customer not found", 404);
  return successResponse(res, customer);
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (!id) return errorResponse(res, "Invalid customer ID", 400);

  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => { errors[e.path.join(".")] = e.message; });
    return errorResponse(res, "Validation failed", 400, errors);
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return errorResponse(res, "Customer not found", 404);

  const data = parsed.data;
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.mobile !== undefined && { mobile: data.mobile }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.businessName !== undefined && { businessName: data.businessName }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber || null }),
      ...(data.customerType !== undefined && { customerType: data.customerType }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.followUpDate !== undefined && {
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  return successResponse(res, customer, "Customer updated successfully");
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (!id) return errorResponse(res, "Invalid customer ID", 400);

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) return errorResponse(res, "Customer not found", 404);

  await prisma.customer.delete({ where: { id } });
  return successResponse(res, null, "Customer deleted successfully");
};

export const createFollowUp = async (req: AuthRequest, res: Response) => {
  const customerId = req.params.id as string;
  if (!customerId) return errorResponse(res, "Invalid customer ID", 400);

  const parsed = createFollowUpSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((e) => { errors[e.path.join(".")] = e.message; });
    return errorResponse(res, "Validation failed", 400, errors);
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return errorResponse(res, "Customer not found", 404);

  const followUp = await prisma.followUp.create({
    data: {
      customerId,
      followUpDate: new Date(parsed.data.followUpDate),
      notes: parsed.data.notes,
      createdById: req.user!.userId,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  // Update customer's main followUpDate
  await prisma.customer.update({
    where: { id: customerId },
    data: { followUpDate: new Date(parsed.data.followUpDate) },
  });

  return successResponse(res, followUp, "Follow-up created successfully", 201);
};
