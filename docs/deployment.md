# Deployment Guide

## Architecture Topology
- **Database**: PostgreSQL database hosted on Neon.tech.
- **Backend**: Node.js Express server. Recommended deployment: Render, Railway, or Heroku.
- **Frontend**: Static React build (Vite). Recommended deployment: Vercel, Netlify, or Cloudflare Pages.

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="generate-a-secure-random-string-here"
CORS_ORIGIN="https://your-frontend-domain.com"
NODE_ENV="production"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="https://your-backend-api-domain.com"
```

## Backend Deployment Steps
1. Provision a PostgreSQL database (e.g., Neon).
2. Set `DATABASE_URL` and run migrations: `npx prisma db push` or `npx prisma migrate deploy`.
3. Set the build command to: `npm install && npx prisma generate && npm run build`
4. Set the start command to: `npm start`
5. Configure environment variables (including `CORS_ORIGIN` pointing to the frontend URL).

## Frontend Deployment Steps
1. Set the build command to: `npm run build`
2. Set the output directory to: `dist`
3. Configure the `VITE_API_URL` environment variable to point to your live backend.
4. Ensure the hosting provider is configured to handle SPA routing (rewriting all 404s to `index.html`).

## Post-Deployment
- Run the seed script manually once to create the initial Admin user, or create a secure initialization endpoint.
- Verify CORS headers are correctly allowing communication between the frontend and backend domains.
