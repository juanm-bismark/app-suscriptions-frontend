import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import type { JWT } from "next-auth/jwt"
import type { TokenResponse } from "@/lib/types/api"
import type { Profile, UserRole } from "@/lib/types/user"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      accessToken?: string
      accessTokenExpiresAt?: number
      role?: UserRole
      companyId?: string | null
      error?: "RefreshAccessTokenError"
    } & DefaultSession["user"]
  }

  interface User {
    accessToken?: string
    refreshToken?: string
    accessTokenExpiresAt?: number
    role?: UserRole
    companyId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpiresAt?: number
    role?: UserRole
    companyId?: string | null
    error?: "RefreshAccessTokenError"
  }
}

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "production"
    ? undefined
    : "app-suscripciones-local-development-auth-secret")
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60_000
const refreshRequests = new Map<string, Promise<JWT>>()

const credentialsSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials"
}

class AuthServiceUnavailableError extends CredentialsSignin {
  code = "auth_service_unavailable"
}

function logAuthError(error: Error & { type?: string }) {
  if (process.env.NODE_ENV !== "production" && error.type === "JWTSessionError") {
    return
  }
  console.error(error)
}

function decodeJwtSubject(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1]
    if (!payload) return null

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=")
    const claims = JSON.parse(atob(normalizedPayload)) as { sub?: unknown }

    return typeof claims.sub === "string" ? claims.sub : null
  } catch {
    return null
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" }
  }

  const existingRefresh = refreshRequests.get(token.refreshToken)
  if (existingRefresh) return existingRefresh

  const refreshRequest = refreshAccessTokenRequest(token).finally(() => {
    if (token.refreshToken) refreshRequests.delete(token.refreshToken)
  })

  refreshRequests.set(token.refreshToken, refreshRequest)
  return refreshRequest
}

async function refreshAccessTokenRequest(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" }
  }

  try {
    const response = await fetch(`${API_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    })

    if (!response.ok) {
      return { ...token, error: "RefreshAccessTokenError" }
    }

    const data = (await response.json()) as TokenResponse

    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt: Date.now() + data.expires_in * 1000,
      error: undefined,
    }
  } catch (error) {
    console.error("Refresh token error:", error)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

async function revokeRefreshToken(refreshToken: unknown) {
  if (typeof refreshToken !== "string" || !refreshToken) return

  try {
    await fetch(`${API_URL}/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch (error) {
    console.error("Refresh token revoke error:", error)
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: AUTH_SECRET,
  logger: {
    error: logAuthError,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const response = await fetch(`${API_URL}/v1/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: parsed.data.email,
              password: parsed.data.password,
            }),
          })

          if (response.status >= 500) {
            throw new AuthServiceUnavailableError()
          }

          if (!response.ok) {
            throw new InvalidCredentialsError()
          }

          const data = (await response.json()) as TokenResponse
          const subject = decodeJwtSubject(data.access_token)
          if (!subject) {
            return null
          }

          const profileResponse = await fetch(`${API_URL}/v1/me`, {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          })

          if (profileResponse.status >= 500) {
            throw new AuthServiceUnavailableError()
          }

          if (!profileResponse.ok) {
            return null
          }

          const profile = (await profileResponse.json()) as Profile
          if (profile.id !== subject) {
            return null
          }

          return {
            id: profile.id,
            email: parsed.data.email,
            name: profile.full_name ?? undefined,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpiresAt: Date.now() + data.expires_in * 1000,
            role: profile.role,
            companyId: profile.company_id,
          }
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error
          console.error("Auth Error:", error)
          throw new AuthServiceUnavailableError()
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpiresAt = user.accessTokenExpiresAt
        token.role = user.role
        token.companyId = user.companyId
        token.error = undefined
        return token
      }

      if (
        token.accessTokenExpiresAt &&
        !token.error &&
        Date.now() > token.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_MARGIN_MS
      ) {
        return refreshAccessToken(token)
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.accessToken = token.accessToken as string | undefined
        session.user.accessTokenExpiresAt = token.accessTokenExpiresAt as number | undefined
        session.user.role = token.role as UserRole | undefined
        session.user.companyId = token.companyId as string | null | undefined
        session.user.error = token.error
      }
      return session
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message) {
        await revokeRefreshToken(message.token?.refreshToken)
      }
    },
  },
})
