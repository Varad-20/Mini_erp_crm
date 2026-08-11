# Database Schema

The system uses PostgreSQL and is mapped via Prisma ORM.

## Core Models

### User
Stores application users and their roles for RBAC.
- Roles: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`

### Customer
Manages client data for CRM features.
- Types: `RETAIL`, `WHOLESALE`, `DISTRIBUTOR`
- Status: `LEAD`, `ACTIVE`, `INACTIVE`
- Includes `followUpDate` for sales tracking.

### FollowUp
A ledger of interaction notes linked to a `Customer`.

### Product
The catalog of items available for sale.
- Tracks `currentStock` and `minimumStock`.
- Includes `warehouseLocation`.

### StockMovement
An immutable ledger tracking all inventory changes.
- Types: `IN` (Receiving), `OUT` (Dispatching/Sales)
- Must always be linked to a `Product`.

### Challan & ChallanItem
Records sales orders (Delivery Challans).
- Status: `DRAFT`, `CONFIRMED`, `CANCELLED`
- Creating a `DRAFT` challan does not deduct stock.
- Confirming a challan atomically deducts stock from `Product` and generates `OUT` records in `StockMovement`.

## Constraints & Concurrency
- `Product.sku` is unique.
- Stock deductions are handled in an atomic `prisma.$transaction` with strict `currentStock >= quantity` checks to prevent race conditions and negative inventory.
