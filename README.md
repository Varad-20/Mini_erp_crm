# Mini ERP + CRM Operations Portal

A complete, production-ready Full Stack ERP and CRM application built for wholesale/distribution companies. It manages customers, products, stock movements, and sales challans with atomic stock deduction and role-based access control (RBAC).

## Features

- **Authentication & RBAC**: Secure JWT-based authentication. Roles include Admin, Sales, Warehouse, and Accounts.
- **Customer CRM**: Manage retail, wholesale, and distributor clients with follow-up tracking.
- **Product & Inventory**: Track products, manage stock levels, and get low-stock alerts.
- **Stock Movements**: Record IN/OUT movements with an immutable ledger.
- **Sales Challans**: Create draft challans and confirm them to deduct stock atomically via database transactions.
- **Dashboard**: Real-time overview of statistics, recent challans, low-stock products, and upcoming follow-ups.

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (via Neon)
- **ORM**: Prisma (with PrismaPg adapter)
- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS v4
- **State & Data Fetching**: TanStack React Query, Axios
- **Form & Validation**: React Hook Form, Zod

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- A PostgreSQL database (Neon recommended)

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
   JWT_SECRET="your_strong_secret_key_here"
   CORS_ORIGIN="http://localhost:5173"
   NODE_ENV="development"
   ```
4. Generate Prisma client and push schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Seed the database with sample data:
   ```bash
   npm run seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   VITE_API_URL="http://localhost:5000"
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Default Roles (Seed Data)
The database seeder creates 4 default users (password for all: `Password@123`):
- `admin@test.com` (Admin)
- `sales@test.com` (Sales)
- `warehouse@test.com` (Warehouse)
- `accounts@test.com` (Accounts)

## Documentation

Comprehensive documentation can be found in the `docs/` directory:
- [Architecture & Design](docs/architecture.md)
- [Database Schema](docs/database.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)

An included `mini-erp-crm.postman_collection.json` file contains all API endpoints pre-configured for Postman.
