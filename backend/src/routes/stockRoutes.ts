import { Router } from "express";
import {
  getStockOverview,
  getStockMovements,
  createStockMovement,
} from "../controllers/stockController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { UserRole } from '../types/enums';

const router = Router();

router.use(authenticate);

// All roles can view stock
router.get("/", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE, UserRole.ACCOUNTS), getStockOverview);
router.get("/movements", authorize(UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.ACCOUNTS), getStockMovements);

// Only ADMIN and WAREHOUSE can manually adjust stock
router.post("/movements", authorize(UserRole.ADMIN, UserRole.WAREHOUSE), createStockMovement);

export default router;
