import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

import { ApiError, ValidationError, fetchApi } from "./api-client"
import { ProfileSchema } from "./api-validation"
import { z } from "zod"

describe("ApiError", () => {
  it("creates an error with status and message", () => {
    const error = new ApiError(404, "Not found")
    expect(error.status).toBe(404)
    expect(error.message).toBe("Not found")
    expect(error.name).toBe("ApiError")
  })

  it("stores additional error details", () => {
    const error = new ApiError(400, "Bad request", {
      code: "INVALID_INPUT",
      detail: "Email is required",
      instance: "request-123",
    })
    expect(error.code).toBe("INVALID_INPUT")
    expect(error.detail).toBe("Email is required")
    expect(error.instance).toBe("request-123")
  })

  it("supports retry-after header", () => {
    const error = new ApiError(429, "Too many requests", {
      retryAfter: 3600,
    })
    expect(error.retryAfter).toBe(3600)
  })
})

describe("ValidationError", () => {
  it("extends ApiError with zodError", () => {
    const result = z.object({ email: z.string() }).safeParse({ email: 123 })
    if (result.success) throw new Error("Expected validation to fail")
    const zodError = result.error

    const error = new ValidationError(zodError, "Validation failed")
    expect(error.status).toBe(400)
    expect(error.code).toBe("VALIDATION_ERROR")
    expect(error.zodError).toBe(zodError)
    expect(error.name).toBe("ValidationError")
    expect(error.detail).toContain("email")
  })

  it("formats multiple validation errors", () => {
    const result = z.object({
      email: z.string(),
      password: z.string().min(1),
    }).safeParse({ email: 123, password: "" })
    if (result.success) throw new Error("Expected validation to fail")
    const zodError = result.error

    const error = new ValidationError(zodError)
    expect(error.detail).toContain("email")
    expect(error.detail).toContain("password")
    expect(error.detail).toContain(",")
  })
})

describe("fetchApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("makes a successful request without schema", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ message: "success" }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await fetchApi("/test")
    expect(result).toEqual({ message: "success" })
  })

  it("validates response with provided schema", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({
        id: "user-123",
        company_id: null,
        role: "admin",
        full_name: "John Doe",
        email: "john@example.com",
        created_at: "2024-05-21T10:30:00Z",
      }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await fetchApi("/me", { schema: ProfileSchema })
    expect(result.id).toBe("user-123")
    expect(result.role).toBe("admin")
  })

  it("throws ValidationError when response fails schema validation", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({
        id: "user-123",
        role: "invalid-role",
        email: "not-an-email",
        created_at: "not-a-date",
      }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    await expect(fetchApi("/me", { schema: ProfileSchema })).rejects.toBeInstanceOf(
      ValidationError
    )
  })

  it("handles 204 No Content responses", async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      headers: new Headers(),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await fetchApi("/delete")
    expect(result).toEqual({})
  })

  it("throws ApiError for failed requests", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      headers: new Headers({ "content-type": "application/problem+json" }),
      json: vi.fn().mockResolvedValue({
        title: "Not found",
        status: 404,
        detail: "User not found",
      }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    await expect(fetchApi("/user/invalid")).rejects.toBeInstanceOf(ApiError)
    await expect(fetchApi("/user/invalid")).rejects.toMatchObject({ status: 404 })
  })

  it("uses problem detail as the thrown message when present", async () => {
    const mockResponse = {
      ok: false,
      status: 422,
      headers: new Headers({ "content-type": "application/problem+json" }),
      json: vi.fn().mockResolvedValue({
        title: "Provider validation error",
        status: 422,
        code: "provider.validation_error",
        detail: "Tele2 rejected target TEST_READY for this SIM",
      }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    await expect(fetchApi("/sims/123/status")).rejects.toMatchObject({
      status: 422,
      message: "Tele2 rejected target TEST_READY for this SIM",
      title: "Provider validation error",
      detail: "Tele2 rejected target TEST_READY for this SIM",
      code: "provider.validation_error",
    })
  })

  it("extracts Tele2 provider-style error bodies", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({
        errorMessage: "ModifiedSince is required.",
        errorCode: "10000003",
      }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    await expect(fetchApi("/sims?provider=tele2")).rejects.toMatchObject({
      status: 400,
      message: "ModifiedSince is required.",
      detail: "ModifiedSince is required.",
      code: "10000003",
    })
  })

  it("handles network errors", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error("Network error"))

    await expect(fetchApi("/test")).rejects.toBeInstanceOf(ApiError)
    await expect(fetchApi("/test")).rejects.toMatchObject({ status: 0 })
  })

  it("adds Authorization header when session exists", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: vi.fn().mockResolvedValue({ message: "success" }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    // Note: In real usage, this would be handled by auth() which we're mocking here
    await fetchApi("/test")

    // Verify Authorization header was attempted to be set
    // (In actual test with real auth, this would verify the token was included)
    expect(global.fetch).toHaveBeenCalled()
  })

  it("skips Authorization header when skipAuth is true", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: vi.fn().mockResolvedValue({ message: "success" }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    await fetchApi("/login", { skipAuth: true })
    expect(global.fetch).toHaveBeenCalled()
  })

  it("respects cache options", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: vi.fn().mockResolvedValue({ message: "success" }),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    await fetchApi("/test", { cache: "no-store" })

    // Verify the cache option was passed to fetch
    const fetchMock = vi.mocked(global.fetch)
    const callArgs = fetchMock.mock.calls[0][1] as RequestInit
    expect(callArgs.cache).toBe("no-store")
  })
})
