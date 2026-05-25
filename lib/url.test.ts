import { describe, expect, it } from "vitest"
import { buildHref } from "./url"

describe("buildHref", () => {
  it("serializes query params", () => {
    expect(buildHref("/dashboard/users", { page: 2, size: 50, q: "acme" })).toBe("/dashboard/users?page=2&size=50&q=acme")
  })

  it("skips empty values", () => {
    expect(buildHref("/dashboard/users", { page: 1, q: "", companyId: null, cursor: undefined })).toBe("/dashboard/users?page=1")
  })

  it("returns the path when no query params remain", () => {
    expect(buildHref("/dashboard/users", { q: "" })).toBe("/dashboard/users")
  })
})
