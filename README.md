# Mini ERP + CRM Operations Portal

A complete, production-ready Full Stack ERP and CRM application built for wholesale/distribution companies. It seamlessly manages customers, products, stock movements, and sales challans with atomic stock deduction and role-based access control (RBAC).

---

## 🚀 Features

- **Authentication & RBAC**: Secure JWT-based authentication. Roles include Admin, Sales, Warehouse, and Accounts.
- **Customer CRM**: Manage retail, wholesale, and distributor clients with follow-up tracking.
- **Product & Inventory**: Track products, manage stock levels, and get low-stock alerts.
- **Stock Movements**: Record IN/OUT movements with an immutable ledger.
- **Sales Challans**: Create draft challans and confirm them to deduct stock atomically via database transactions.
- **Dashboard**: Real-time overview of statistics, recent challans, low-stock products, and upcoming follow-ups.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State & Data Fetching**: TanStack React Query, Axios
- **Form Handling & Validation**: React Hook Form, Zod
- **Routing**: React Router DOM

### Backend
- **Environment**: Node.js & Express.js
- **Language**: TypeScript
- **Database**: SQLite (Local File)
- **ORM**: Prisma
- **Authentication**: JWT & bcrypt

---

## 📁 Project Structure

This is a monorepo setup containing both the frontend and backend applications.

```
mini-erp-crm/
├── backend/                # Node.js Express API
│   ├── prisma/             # Prisma schema and local SQLite database
│   ├── src/                # Backend source code
│   │   ├── config/         # Configuration files (e.g., Prisma client)
│   │   ├── controllers/    # Route controllers handling business logic
│   │   ├── middleware/     # Custom Express middleware (Auth, Error handling)
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Core business logic and database interactions
│   │   ├── types/          # TypeScript interfaces and enums
│   │   ├── utils/          # Helper functions and formatters
│   │   ├── app.ts          # Express app configuration
│   │   └── server.ts       # Application entry point
│   ├── .env                # Backend Environment variables
│   └── package.json        # Backend dependencies
│
├── frontend/               # React Vite Application
│   ├── src/                # Frontend source code
│   │   ├── components/     # Reusable UI components (Buttons, Inputs, Modals)
│   │   ├── context/        # React context (Auth context)
│   │   ├── pages/          # Application pages (Dashboard, Customers, etc.)
│   │   ├── services/       # API call definitions (Axios setup)
│   │   ├── types/          # Frontend TypeScript types
│   │   ├── App.tsx         # Root React component
│   │   └── main.tsx        # React entry point
│   ├── .env                # Frontend Environment variables
│   ├── tailwind.config.js  # Tailwind configuration
│   ├── vite.config.ts      # Vite configuration
│   └── package.json        # Frontend dependencies
│
├── docs/                   # Additional documentation
└── README.md               # This file
```

---

## 🛠️ Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="mini_erp_crm_super_secret_key"
   CORS_ORIGIN="http://localhost:5173"
   ADMIN_EMAIL="admin@minierp.com"
   ADMIN_PASSWORD="AdminPassword123"
   ```
4. Generate the Prisma Client and create the SQLite database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *(Note: The server will automatically seed the `ADMIN_EMAIL` user into the database upon the first successful startup if no users exist).*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL="http://localhost:5000"
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`. You can log in using the credentials defined in your backend `.env` file.

---

## 🌐 Deployment Guidelines

**Backend Deployment (e.g., Render)**
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run build`
- **Start Command**: `npm start`
- **Required Environment Variables**: Add all the variables from your `backend/.env` file.
> **Note**: Free-tier cloud instances with ephemeral storage will lose SQLite data upon restart. For production persistence, use a persistent disk or migrate the provider back to a cloud database (like PostgreSQL/MongoDB).

**Frontend Deployment (e.g., Vercel / Netlify)**
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Required Environment Variables**: 
  - `VITE_API_URL`: Set this to your deployed backend URL.

---

## 📚 Additional Documentation

Comprehensive documentation can be found in the `docs/` directory:
- [Architecture & Design](docs/architecture.md)
- [Database Schema](docs/database.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)

An included `mini-erp-crm.postman_collection.json` file contains all API endpoints pre-configured for testing via Postman.
