# Bismark Frontend

Next.js dashboard wired to the Subscriptions API backend.

## Setup

Create `.env.local` in this directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://localhost:8000
AUTH_SECRET=replace-with-a-long-random-secret
```

`API_URL` is used by Server Components and Server Actions. If it is omitted,
the app falls back to `NEXT_PUBLIC_API_URL`.

Install dependencies and run the app:

```bash
npm install --no-audit --no-fund
npm run dev
```

Open http://localhost:3000.

## Docker

A production image is provided. `docker-compose.yml` builds from the local
`Dockerfile`, exposes port 3000, and reads environment from `.env.production`.
It attaches to an external network named `app-suscriptions-net`.

```bash
docker compose up --build
```

## Auth Flow

The frontend does not own user passwords or tenant data. It delegates auth to
the backend:

1. `/register` calls `POST /v1/auth/signup`.
2. `/login` uses NextAuth Credentials and calls `POST /v1/auth/login`.
3. The backend returns an access token, refresh token, expiry, role, and company id.
4. NextAuth stores those values in the JWT session.
5. Server-side API calls use `fetchApi`, which adds `Authorization: Bearer <accessToken>`.
6. When the access token expires, `auth.ts` calls `POST /v1/auth/refresh` and rotates the refresh token.
7. Logout calls `POST /v1/auth/logout` so the backend can revoke the refresh token.

## Backend API

All app backend calls should go through `lib/api/*` helpers and `lib/api-client.ts`.
`fetchApi` automatically prefixes paths with `/v1`, parses Problem Details
responses, and exposes them as `ApiError`.

Key flows:

- SIM listing and detail: `lib/api/sims.ts`
- Provider credentials (upsert, test, delete): `lib/credentials/actions/`
- Current user/company helpers: `lib/auth/current-user.ts`
- SIM CSV bootstrap import: `/dashboard/sims/import`

## Validation

```bash
npm run typecheck
npm run build
npm run lint
npm run test
```

`npm run test` runs the Vitest suite (`vitest run`).

`next/font` downloads Google font assets during build. In a network-restricted
sandbox, the build may need network approval.
