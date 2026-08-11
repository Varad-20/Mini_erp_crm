// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdById?: number | null;
  createdBy?: { id: number; name: string } | null;
  followUps?: FollowUp[];
}

export interface FollowUp {
  id: number;
  customerId: number;
  followUpDate: string;
  notes: string;
  createdAt: string;
  createdById: number;
  createdBy?: { id: number; name: string };
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Stock Movement ───────────────────────────────────────────────────────────

export type StockMovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: number;
  productId: number;
  quantity: number;
  movementType: StockMovementType;
  reason: string;
  createdAt: string;
  createdById: number;
  product?: { id: number; name: string; sku: string };
  createdBy?: { id: number; name: string };
}

// ─── Challan ──────────────────────────────────────────────────────────────────

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: number;
  challanId: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  product?: Product;
}

export interface Challan {
  id: number;
  challanNumber: string;
  customerId: number;
  totalQuantity: number;
  status: ChallanStatus;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  customer?: { id: number; name: string; businessName: string };
  createdBy?: { id: number; name: string };
  items?: ChallanItem[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  stats: {
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    todaysChallans: number;
  };
  recentChallans: Challan[];
  lowStockProducts: Product[];
  upcomingFollowUps: Customer[];
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CustomerQueryParams extends PaginationParams {
  search?: string;
  status?: CustomerStatus | '';
  type?: CustomerType | '';
}

export interface ProductQueryParams extends PaginationParams {
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export interface ChallanQueryParams extends PaginationParams {
  search?: string;
  status?: ChallanStatus | '';
  customerId?: number;
}
