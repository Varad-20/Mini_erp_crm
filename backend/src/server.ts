import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";

import app from "./app";
import { prisma } from "./config/prisma";

const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Auto-seed admin user if no users exist
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("No users found. Seeding admin user from .env credentials...");
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (adminEmail && adminPassword) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
          data: {
            name: "Admin User",
            email: adminEmail,
            passwordHash,
            role: "ADMIN"
          }
        });
        console.log("✅ Admin user seeded successfully!");
      } else {
        console.warn("⚠️ ADMIN_EMAIL and ADMIN_PASSWORD not found in .env. Skipping admin seed.");
      }
    }
    
    app.listen(PORT, () => {
      console.log(`✅ Mini ERP CRM API running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  }
}

startServer();