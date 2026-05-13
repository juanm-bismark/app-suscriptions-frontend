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
  email: string | null
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

export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export const isAdmin = (role?: UserRole) => role === ROLES.ADMIN
export const canAccessDashboard = (role?: UserRole) =>
  role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.MEMBER
export const canManageUsers = (role?: UserRole) =>
  role === ROLES.ADMIN || role === ROLES.MANAGER
export const canManageCompanies = isAdmin
