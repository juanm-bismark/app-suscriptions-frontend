import { describe, it, expect } from "vitest"
import {
  isAdmin,
  canAccessDashboard,
  canManageUsers,
  canManageCompanies,
  ROLES,
} from "@/lib/types/user"

describe("Auth Permission Functions", () => {
  describe("isAdmin", () => {
    it("returns true for admin role", () => {
      expect(isAdmin(ROLES.ADMIN)).toBe(true)
    })

    it("returns false for non-admin roles", () => {
      expect(isAdmin(ROLES.MANAGER)).toBe(false)
      expect(isAdmin(ROLES.MEMBER)).toBe(false)
      expect(isAdmin(ROLES.PUBLIC)).toBe(false)
    })

    it("returns false for undefined role", () => {
      expect(isAdmin(undefined)).toBe(false)
    })
  })

  describe("canAccessDashboard", () => {
    it("returns true for admin role", () => {
      expect(canAccessDashboard(ROLES.ADMIN)).toBe(true)
    })

    it("returns true for manager role", () => {
      expect(canAccessDashboard(ROLES.MANAGER)).toBe(true)
    })

    it("returns true for member role", () => {
      expect(canAccessDashboard(ROLES.MEMBER)).toBe(true)
    })

    it("returns false for public role", () => {
      expect(canAccessDashboard(ROLES.PUBLIC)).toBe(false)
    })

    it("returns false for undefined role", () => {
      expect(canAccessDashboard(undefined)).toBe(false)
    })
  })

  describe("canManageUsers", () => {
    it("returns true for admin role", () => {
      expect(canManageUsers(ROLES.ADMIN)).toBe(true)
    })

    it("returns true for manager role", () => {
      expect(canManageUsers(ROLES.MANAGER)).toBe(true)
    })

    it("returns false for member role", () => {
      expect(canManageUsers(ROLES.MEMBER)).toBe(false)
    })

    it("returns false for public role", () => {
      expect(canManageUsers(ROLES.PUBLIC)).toBe(false)
    })

    it("returns false for undefined role", () => {
      expect(canManageUsers(undefined)).toBe(false)
    })
  })

  describe("canManageCompanies", () => {
    it("returns true for admin role", () => {
      expect(canManageCompanies(ROLES.ADMIN)).toBe(true)
    })

    it("returns false for non-admin roles", () => {
      expect(canManageCompanies(ROLES.MANAGER)).toBe(false)
      expect(canManageCompanies(ROLES.MEMBER)).toBe(false)
      expect(canManageCompanies(ROLES.PUBLIC)).toBe(false)
    })

    it("returns false for undefined role", () => {
      expect(canManageCompanies(undefined)).toBe(false)
    })
  })
})

describe("Auth Role Hierarchy", () => {
  it("admin has all permissions", () => {
    expect(isAdmin(ROLES.ADMIN)).toBe(true)
    expect(canAccessDashboard(ROLES.ADMIN)).toBe(true)
    expect(canManageUsers(ROLES.ADMIN)).toBe(true)
    expect(canManageCompanies(ROLES.ADMIN)).toBe(true)
  })

  it("manager can access dashboard and manage users, but not companies", () => {
    expect(isAdmin(ROLES.MANAGER)).toBe(false)
    expect(canAccessDashboard(ROLES.MANAGER)).toBe(true)
    expect(canManageUsers(ROLES.MANAGER)).toBe(true)
    expect(canManageCompanies(ROLES.MANAGER)).toBe(false)
  })

  it("member can only access dashboard", () => {
    expect(isAdmin(ROLES.MEMBER)).toBe(false)
    expect(canAccessDashboard(ROLES.MEMBER)).toBe(true)
    expect(canManageUsers(ROLES.MEMBER)).toBe(false)
    expect(canManageCompanies(ROLES.MEMBER)).toBe(false)
  })

  it("public cannot access dashboard", () => {
    expect(isAdmin(ROLES.PUBLIC)).toBe(false)
    expect(canAccessDashboard(ROLES.PUBLIC)).toBe(false)
    expect(canManageUsers(ROLES.PUBLIC)).toBe(false)
    expect(canManageCompanies(ROLES.PUBLIC)).toBe(false)
  })
})
