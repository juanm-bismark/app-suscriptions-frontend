export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
}

export type User = Profile

export interface Company {
  id: string
  name: string
  subscription_status?: string
}

export const isAdmin = (role?: UserRole) => role === ROLES.ADMIN
export const canManageUsers = (role?: UserRole) =>
  role === ROLES.ADMIN || role === ROLES.MANAGER
