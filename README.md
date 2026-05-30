# SportSync Tournament Engine

Backend-focused full-stack tournament management platform.

## How to run Swagger

Install dependencies, start the API, then open Swagger UI:

```bash
pnpm install
pnpm dev:api
```

Swagger UI is available at:

```txt
http://localhost:4000/api-docs
```

For protected endpoints, first call `POST /api/v1/auth/login` or `POST /api/v1/auth/register`, copy the `accessToken`, click **Authorize** in Swagger UI, and enter:

```txt
Bearer <token>
```
