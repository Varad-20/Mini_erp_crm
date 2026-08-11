import { prisma } from "../config/prisma";

/**
 * Generates a unique challan number in format: CH-YYYYMMDD-NNN
 * Uses the count of challans created today to ensure uniqueness.
 */
export const generateChallanNumber = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const count = await prisma.challan.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, "0");
  return `CH-${dateStr}-${sequence}`;
};
