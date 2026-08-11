import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { successResponse, errorResponse } from "../utils/response";

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalCustomers,
      totalProducts,
      allProducts,
      todaysChallans,
      recentChallans,
      upcomingFollowUps,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, currentStock: true, minimumStock: true, warehouseLocation: true },
      }),
      prisma.challan.count({
        where: { createdAt: { gte: startOfToday, lt: endOfToday } },
      }),
      prisma.challan.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: { gte: startOfToday },
          status: { not: "INACTIVE" },
        },
        take: 5,
        orderBy: { followUpDate: "asc" },
        select: {
          id: true,
          name: true,
          businessName: true,
          mobile: true,
          status: true,
          followUpDate: true,
        },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minimumStock);

    return successResponse(res, {
      stats: {
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        todaysChallans,
      },
      recentChallans,
      lowStockProducts: lowStockProducts.slice(0, 8),
      upcomingFollowUps,
    });
  } catch (error) {
    console.error("[Dashboard] Error:", error);
    return errorResponse(res, "Failed to load dashboard data", 500);
  }
};
