import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
} from "../controllers/productController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { UserRole } from '../types/enums';

const router = Router();

router.use(authenticate);

// All authenticated roles can view products
router.get("/categories", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE, UserRole.ACCOUNTS), getCategories);
router.get("/", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE, UserRole.ACCOUNTS), getProducts);
router.get("/:id", authorize(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE, UserRole.ACCOUNTS), getProductById);

// ADMIN, WAREHOUSE can create/edit/delete products
router.post("/", authorize(UserRole.ADMIN, UserRole.WAREHOUSE), createProduct);
router.put("/:id", authorize(UserRole.ADMIN, UserRole.WAREHOUSE), updateProduct);
router.delete("/:id", authorize(UserRole.ADMIN), deleteProduct);

export default router;
