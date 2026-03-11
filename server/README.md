# ChatDesk Server API

Express.js backend for ChatDesk — handles WhatsApp sessions, AI agents, broadcasts, and admin operations.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env and fill in values
cp .env.example .env

# Run in development
npm run dev

# Run in production
npm start
```

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── index.js          # Env validation & config object
│   │   └── supabase.js       # Supabase admin + per-request clients
│   ├── controllers/           # Route handlers (Steps 2-5)
│   ├── middlewares/
│   │   ├── auth.js            # JWT verification, role & org guards
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── planGate.js        # Subscription feature gating
│   │   ├── rateLimiter.js     # Rate limiting
│   │   └── validate.js        # Joi validation middleware
│   ├── routes/
│   │   ├── index.js           # Route aggregator
│   │   └── health.routes.js   # Health check
│   ├── services/              # Business logic (Steps 2-5)
│   ├── utils/
│   │   ├── ApiError.js        # Custom HTTP error class
│   │   ├── catchAsync.js      # Async error wrapper
│   │   └── logger.js          # Winston logger
│   ├── app.js                 # Express app setup
│   └── index.js               # Server entry point
├── .env.example
├── .dockerignore
├── Dockerfile
└── package.json
```

## Middleware Pipeline

1. **helmet** — Security headers
2. **cors** — Restricted to configured origins
3. **express.json** — Body parsing (5 MB limit)
4. **morgan** — HTTP request logging
5. **rateLimiter** — 100 req / 15 min per IP (configurable)
6. **auth** — Verifies Supabase JWT, attaches `req.user`
7. **requireOrganization** — Loads org context + plan features into `req.organization`
8. **requireRole(...)** — Restricts route to specified roles
9. **requireFeature(...)** — Gates access by subscription plan flags
10. **validate(schema)** — Joi request body/params/query validation
11. **errorHandler** — Catches all errors, returns consistent JSON

## Docker

```bash
# From project root
docker-compose up --build
```
