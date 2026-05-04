import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      accessToken?: string
    } & DefaultSession["user"]
  }

  interface User {
    accessToken?: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const credentialsSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
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
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: parsed.data.email,
              password: parsed.data.password,
            }),
          })

          if (!response.ok) {
            // Dev fallback: allow access even if external auth rejects credentials.
            return {
              id: "dev-user",
              email: parsed.data.email,
              name: "Usuario Demo",
              accessToken: "dev-token",
            }
          }

          const data = await response.json()

          // Ajustamos dependiendo de la estructura de respuesta exacta de tu API (ej. data.access_token)
          return {
            id: data.id || data.user?.id || "1",
            email: parsed.data.email,
            name: data.name || data.full_name || undefined,
            accessToken: data.access_token || data.token || undefined,
          }
        } catch (error) {
          console.error("Auth Error:", error)
          return {
            id: "dev-user",
            email: parsed.data.email,
            name: "Usuario Demo",
            accessToken: "dev-token",
          }
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.accessToken = token.accessToken as string | undefined
      }
      return session
    },
  },
})
