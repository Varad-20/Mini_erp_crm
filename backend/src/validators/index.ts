import { z } from "zod";

// ─── Auth Validators ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Customer Validators ──────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  mobile: z
    .string()
    .min(10, "Mobile must be at least 10 digits")
    .max(15)
    .regex(/^\+?[\d\s-]+$/, "Invalid mobile number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  businessName: z.string().min(1, "Business name is required").max(150),
  gstNumber: z.string().max(20).optional().or(z.literal("")),
  customerType: z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]),
  address: z.string().min(1, "Address is required").max(500),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("LEAD"),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  followUpDate: z.string().min(1, "Follow-up date is required"),
  notes: z.string().min(1, "Notes are required").max(1000),
});

// ─── Product Validators ────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(150),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "SKU can only contain letters, numbers, hyphens, and underscores"),
  category: z.string().min(1, "Category is required").max(100),
  unitPrice: z.coerce
    .number({ error: "Unit price must be a number" })
    .min(0, "Unit price cannot be negative"),
  currentStock: z.coerce
    .number({ error: "Stock must be a number" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  minimumStock: z.coerce
    .number({ error: "Minimum stock must be a number" })
    .int("Minimum stock must be a whole number")
    .min(0, "Minimum stock cannot be negative"),
  warehouseLocation: z.string().min(1, "Warehouse location is required").max(100),
});

export const updateProductSchema = createProductSchema.partial();

// ─── Stock Movement Validators ─────────────────────────────────────────────────

export const createStockMovementSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1, "Reason is required").max(500),
});

// ─── Challan Validators ────────────────────────────────────────────────────────

export const challanItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  items: z.array(challanItemSchema).min(1, "At least one item is required"),
  status: z.enum(["DRAFT", "CONFIRMED"]).default("DRAFT"),
});

export const updateChallanSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
});
