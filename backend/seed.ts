import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not defined");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be defined in the .env file");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  console.log("Clearing existing data...");
  await prisma.challanItem.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // ─── Users ─────────────────────────────────────────────────────────────────
  console.log("Seeding Admin User...");
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: passwordHash,
      role: "ADMIN"
    },
    create: { 
      name: "Admin User", 
      email: adminEmail, 
      passwordHash: passwordHash, 
      role: "ADMIN" 
    },
  });

  console.log("✅ Seed completed successfully! Only Admin user seeded.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });