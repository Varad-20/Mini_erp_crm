import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { prisma } from "./config/prisma";

const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    
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