# Architecture & Design

## Overview
Mini ERP + CRM uses a standard Controller-Service-Prisma architecture pattern in the backend, and a Context-Hook-Component pattern in the frontend.

## Backend Architecture
- **Controllers** (`src/controllers/`): Handle HTTP request/response, extract parameters, parse bodies via Zod validators, and return unified JSON responses.
- **Services** (`src/services/`): Handle complex business logic that spans multiple models, particularly database transactions (e.g., `challanService.ts` for atomic stock deduction).
- **Prisma** (`src/config/prisma.ts`): The data access layer.
- **Validators** (`src/validators/`): Centralized Zod schemas for validation.
- **Middleware** (`src/middleware/`): Auth/RBAC checking and global error handling.

## Frontend Architecture
- **Contexts** (`src/context/`): Global state, primarily `AuthContext` for JWT and role management.
- **Hooks** (`src/hooks/`): Custom utilities (e.g., `useToast`).
- **Services** (`src/services/`): Axios API wrappers.
- **Components/UI** (`src/components/ui/`): Reusable, Tailwind-styled primitive components (Button, Input, Card, Modal).
- **Pages** (`src/pages/`): Routed view components organized by feature (auth, customers, products, stock, challans).

## Security & State
- **RBAC**: Handled by the backend `authorize()` middleware and frontend `hasRole` AuthContext utility.
- **Data Caching**: TanStack React Query manages API caching, loading states, and automatic background refetching.
