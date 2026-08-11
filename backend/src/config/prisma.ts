import "dotenv/config";
import { PrismaClient } from "../generated/prisma";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

export const prisma = new PrismaClient();