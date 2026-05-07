export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
  PUBLIC: "public",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export interface Profile {
  id: string
  company_id: string | null
  role: UserRole
  full_name: string | null
  created_at: string
}

export type User = Profile

export interface Company {
  id: string
  name: string
  created_at: string
}

export interface CompanySettings {
  company_id: string
  settings: Record<string, unknown>
  updated_at: string
}

export const isAdmin = (role?: UserRole) => role === ROLES.ADMIN
export const canManageUsers = (role?: UserRole) =>
  role === ROLES.ADMIN || role === ROLES.MANAGER
