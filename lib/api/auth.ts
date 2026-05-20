import { fetchApi } from "@/lib/api-client"
import type { TokenResponse } from "@/lib/types/api"

interface SignupIn {
  email: string
  password: string
  company_name: string
  full_name?: string | null
}

interface RefreshTokenIn {
  refresh_token: string
}

function requestAuth<T>(path: string, body: unknown, options: { skipAuth?: boolean } = {}): Promise<T> {
  return fetchApi<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: options.skipAuth,
  })
}

export function signup(body: SignupIn): Promise<TokenResponse> {
  // Anonymous mode: never attach the caller's token, otherwise the backend
  // treats this as an "invite into my company" flow (contract §1.1).
  return requestAuth<TokenResponse>("/auth/signup", body, { skipAuth: true })
}

export function logout(body: RefreshTokenIn): Promise<Record<string, never>> {
  return requestAuth<Record<string, never>>("/auth/logout", body)
}
