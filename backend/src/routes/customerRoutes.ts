import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createFollowUp,
} from "../controllers/customerController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { UserRole } from '../types/enums';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// ADMIN, SALES, ACCOUNTS can view customers
router.get("/", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS), getCustomers);
router.get("/:id", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS), getCustomerById);

// ADMIN, SALES can create/edit customers
router.post("/", authorize(UserRole.ADMIN, UserRole.SALES), createCustomer);
router.put("/:id", authorize(UserRole.ADMIN, UserRole.SALES), updateCustomer);
router.delete("/:id", authorize(UserRole.ADMIN), deleteCustomer);

// Follow-ups: ADMIN, SALES
router.post("/:id/follow-ups", authorize(UserRole.ADMIN, UserRole.SALES), createFollowUp);

export default router;
