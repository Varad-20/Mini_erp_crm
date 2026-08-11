# API Reference

All endpoints return a unified response format:
```json
{
  "success": true,
  "message": "Action completed",
  "data": { ... } // Or an array for paginated results
}
```

Paginated endpoints include a `pagination` object:
```json
{
  "page": 1,
  "limit": 10,
  "total": 50,
  "totalPages": 5
}
```

## Endpoints

### Auth (`/api/auth`)
- `POST /login`: Authenticate and receive JWT.
- `GET /me`: Get current user info (Requires Auth).

### Dashboard (`/api/dashboard`)
- `GET /`: Get overview statistics, recent challans, and low stock (Requires Auth).

### Customers (`/api/customers`)
- `GET /`: List customers with search/filters.
- `GET /:id`: Get customer details + follow-ups.
- `POST /`: Create customer (Sales/Admin).
- `PUT /:id`: Update customer (Sales/Admin).
- `DELETE /:id`: Delete customer (Admin).
- `POST /:id/follow-ups`: Add a follow-up note (Sales/Admin).

### Products (`/api/products`)
- `GET /`: List products with search/filters.
- `GET /categories`: List unique product categories.
- `GET /:id`: Get product details.
- `POST /`: Create product (Warehouse/Admin).
- `PUT /:id`: Update product (Warehouse/Admin).
- `DELETE /:id`: Delete product (Admin).

### Stock (`/api/stock`)
- `GET /`: Overview of current stock levels.
- `GET /movements`: Paginated ledger of IN/OUT movements.
- `POST /movements`: Record a manual stock movement (Warehouse/Admin).

### Challans (`/api/challans`)
- `GET /`: List challans.
- `GET /:id`: Get challan details + items.
- `POST /`: Create a DRAFT challan (Sales/Admin).
- `PUT /:id`: Update a DRAFT challan.
- `POST /:id/confirm`: Confirm challan and deduct stock (Sales/Admin).
- `POST /:id/cancel`: Void a DRAFT challan (Sales/Admin).
