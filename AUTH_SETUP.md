# Auth Setup

This frontend uses NextAuth for browser sessions, but the backend is the auth
authority. There is no Prisma user table in the frontend.

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://localhost:8000
AUTH_SECRET=replace-with-a-long-random-secret
```

Generate `AUTH_SECRET` with:

```bash
npx auth secret
```

## Runtime Flow

1. Registration submits `POST /v1/auth/signup` from `app/actions/auth.ts`.
2. Login uses the NextAuth Credentials provider in `auth.ts`.
3. The provider calls `POST /v1/auth/login` and receives backend JWTs.
4. The JWT callback stores `accessToken`, `refreshToken`, `expiresAt`, `role`, and `companyId`.
5. Server Components and Server Actions call `fetchApi`, which attaches the access token.
6. When the access token is expired, `auth.ts` calls `POST /v1/auth/refresh`.
7. Logout calls `POST /v1/auth/logout` with the refresh token.

## Routes

- `/register` creates the backend user and tenant.
- `/login` starts a NextAuth session backed by the backend JWT.
- `/dashboard` and nested pages require an authenticated session.
- `/api/auth/*` is handled by NextAuth.

## Troubleshooting

**401 after login**

Check that `API_URL` points to the running backend and that the backend accepts
the credentials used on `/login`.

**Session expires unexpectedly**

Confirm the backend refresh endpoint is reachable at `POST /v1/auth/refresh`
and that `AUTH_SECRET` is stable between app restarts.

**Server Components cannot call the API**

Set `API_URL` to a backend URL reachable from the Next.js server process. The
browser-facing `NEXT_PUBLIC_API_URL` is only the fallback.
