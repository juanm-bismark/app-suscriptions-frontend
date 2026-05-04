import { cache } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { ApiError, fetchApi } from "@/lib/api-client"
import { ROLES, type Company, type Profile, type UserRole } from "@/lib/types/user"

export const getSession = cache(async () => {
  return auth()
})

export const getProfile = cache(async (): Promise<Profile | null> => {
  const session = await getSession()
  if (!session?.user) return null

  try {
    return await fetchApi<Profile>("/me")
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
})

export const getCompany = cache(async (): Promise<Company | null> => {
  const session = await getSession()
  if (!session?.user) return null

  try {
    return await fetchApi<Company>("/companies/me")
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return null
    }
    throw error
  }
})

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect("/login")
  return profile
}

export async function requireRole(...allowed: UserRole[]): Promise<Profile> {
  const profile = await requireProfile()
  if (!allowed.includes(profile.role)) redirect("/dashboard")
  return profile
}

export const requireAdmin = () => requireRole(ROLES.ADMIN)
export const requireManagerOrAdmin = () => requireRole(ROLES.ADMIN, ROLES.MANAGER)
