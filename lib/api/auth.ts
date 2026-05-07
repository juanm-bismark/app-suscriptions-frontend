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

function requestAuth<T>(path: string, body: unknown): Promise<T> {
  return fetchApi<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function signup(body: SignupIn): Promise<TokenResponse> {
  return requestAuth<TokenResponse>("/auth/signup", body)
}

export function logout(body: RefreshTokenIn): Promise<Record<string, never>> {
  return requestAuth<Record<string, never>>("/auth/logout", body)
}
