# Deployment Guide

This repo contains:

- `quiz-buzz`: Next.js frontend
- `quiz-buzz-api`: Fastify backend

## Frontend

Recommended host: Vercel

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

Required environment variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
QUIZ_BUZZ_API_ORIGIN=https://your-backend-domain
```

Notes:

- `QUIZ_BUZZ_API_ORIGIN` is used by the Next.js rewrite so frontend calls to `/api/v1/*` are proxied to the deployed backend.
- Do not set this to a path ending in `/`.

## Backend

Recommended host: Railway, Render, or any Node host

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

Required environment variables:

```bash
MONGODB_URI=...
PORT=8040
CLERK_JWKS_URL=https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.vercel.app
```

Notes:

- `CORS_ORIGIN` supports a comma-separated list.
- The backend already listens on `0.0.0.0`, which is suitable for most hosts.

## Suggested Order

1. Deploy the backend and copy its public HTTPS URL.
2. Set `QUIZ_BUZZ_API_ORIGIN` in the frontend deployment to that backend URL.
3. Deploy the frontend.
4. Update backend `CORS_ORIGIN` to include the frontend production URL.
5. Redeploy the backend if your host does not auto-restart on env changes.
