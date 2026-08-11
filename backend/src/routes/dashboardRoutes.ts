import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { UserRole } from '../types/enums';

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE, UserRole.ACCOUNTS),
  getDashboardStats
);

export default router;
