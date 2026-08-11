import { Router } from "express";
import {
  createChallan,
  getChallans,
  getChallanById,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from "../controllers/challanController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { UserRole } from "../generated/prisma/client";

const router = Router();

router.use(authenticate);

// View challans: ADMIN, SALES, ACCOUNTS
router.get("/", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS), getChallans);
router.get("/:id", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS), getChallanById);

// Create/update challans: ADMIN, SALES
router.post("/", authorize(UserRole.ADMIN, UserRole.SALES), createChallan);
router.put("/:id", authorize(UserRole.ADMIN, UserRole.SALES), updateChallan);

// Confirm/cancel: ADMIN, SALES
router.post("/:id/confirm", authorize(UserRole.ADMIN, UserRole.SALES), confirmChallan);
router.post("/:id/cancel", authorize(UserRole.ADMIN, UserRole.SALES), cancelChallan);

export default router;
