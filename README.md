# SportSync Tournament Engine

SportSync is a full-stack tournament management platform for organizers to run sports competitions from setup to final results. It supports organizer authentication, tournament setup, team and player management, fixture generation, match scoring, standings, playoff qualification, and public read-only tournament pages.

## Features

- Organizer and team captain authentication with access and refresh tokens.
- Tournament lifecycle management: draft, publish, ongoing, completed.
- Team and player management with soft deletes.
- Single round-robin fixture generation.
- Basic knockout fixture generation.
- Score updates with automatic winner detection.
- Standings recalculation with points, wins, losses, draws, and rank.
- Round-robin playoff qualification: semi-finals, final, champion declaration.
- Public tournament viewer for published, ongoing, and completed tournaments.
- Swagger/OpenAPI documentation for backend APIs.

## Tech Stack

- Monorepo: pnpm workspaces
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL, Prisma ORM
- Authentication: JWT access tokens, refresh tokens, bcrypt password hashing
- Frontend: React, TypeScript, Vite, React Router
- Data fetching: TanStack Query, Axios
- Styling: Tailwind CSS, lucide-react icons
- Testing: Jest, Supertest
- Tooling: ESLint, Prettier, Docker Compose

## Architecture

The backend is organized by feature modules. Controllers stay thin, services hold business rules, repositories hold Prisma queries, and middleware handles authentication and role checks.

The frontend uses route-based pages, typed API services, reusable layouts, and TanStack Query for server state. Dashboard routes require authentication, while public tournament routes are accessible without login.

## Folder Structure

```txt
apps/
  api/
    prisma/
      schema.prisma
      seed.ts
    src/
      config/
      docs/
      middleware/
      modules/
      utils/
  web/
    src/
      app/
      components/
      context/
      layouts/
      pages/
      routes/
      services/
      types/
packages/
  shared/
```

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d
```

Generate Prisma client, run migrations, and seed the demo organizer:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Start both apps:

```bash
pnpm dev
```

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:4000
```

## Environment Variables

```txt
DATABASE_URL="postgresql://sportsync:sportsync@localhost:5433/sportsync?schema=public"
API_PORT=4000
WEB_PORT=5173
JWT_ACCESS_TOKEN_SECRET="replace-with-access-token-secret"
JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
JWT_REFRESH_TOKEN_SECRET="replace-with-refresh-token-secret"
JWT_REFRESH_TOKEN_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=12
FRONTEND_URL="http://localhost:5173"
VITE_API_URL="http://localhost:4000/api/v1"
```

## Database Commands

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

Seed user:

```txt
Email: organizer@sportsync.dev
Password: Password@123
Role: ORGANIZER
```

## Swagger

Start the API:

```bash
pnpm dev:api
```

Open Swagger UI:

```txt
http://localhost:4000/api-docs
```

For protected endpoints, call `POST /api/v1/auth/login`, copy the `accessToken`, click **Authorize**, and enter:

```txt
Bearer <token>
```

## Scripts

```bash
pnpm dev          # Run API and web together
pnpm dev:api      # Run API only
pnpm dev:web      # Run web only
pnpm build        # Build all packages/apps
pnpm lint         # Lint all packages/apps
pnpm typecheck    # Typecheck all packages/apps
pnpm test         # Run backend integration tests
pnpm db:migrate   # Run Prisma migrations
pnpm db:seed      # Seed demo data
pnpm db:studio    # Open Prisma Studio
```

## Screenshots

- Login page: add screenshot
- Organizer dashboard: add screenshot
- Tournament details: add screenshot
- Fixtures and standings: add screenshot
- Public tournament viewer: add screenshot

## Deployment Plan

- Provision managed PostgreSQL.
- Set production environment variables and strong JWT secrets.
- Run `pnpm db:migrate` against the production database.
- Build the API and web apps with `pnpm build`.
- Deploy the API as a Node.js service.
- Deploy the Vite frontend as static assets with `VITE_API_URL` pointed at the API.
- Configure CORS `FRONTEND_URL` for the deployed frontend origin.
- Add database backups, API health checks, and log monitoring.

## Resume Highlights

- Built a TypeScript monorepo with React, Express, Prisma, and PostgreSQL.
- Designed secure JWT authentication with refresh token rotation and hashed token storage.
- Implemented modular backend architecture with controllers, services, repositories, validation, and integration tests.
- Built tournament, team, player, fixture, scoring, standings, qualification, and public API modules.
- Created a responsive SaaS-style dashboard and public tournament viewer with typed API services.
- Documented APIs with Swagger/OpenAPI and prepared local setup, migration, and deployment instructions.
