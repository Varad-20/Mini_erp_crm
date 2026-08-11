import { UserRole } from '../types/enums';
import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/userController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

// Only ADMIN can access user management routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;


