import { auth } from "@/auth"
import type { ProblemDetails } from "@/lib/types/api"

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  public code?: string
  public title?: string
  public detail?: string | null
  public instance?: string | null
  public extra?: Record<string, unknown>
  public raw?: unknown

  constructor(
    public status: number,
    message: string,
    init?: {
      code?: string
      title?: string
      detail?: string | null
      instance?: string | null
      extra?: Record<string, unknown>
      raw?: unknown
    }
  ) {
    super(message)
    this.name = "ApiError"
    this.code = init?.code
    this.title = init?.title
    this.detail = init?.detail
    this.instance = init?.instance
    this.extra = init?.extra
    this.raw = init?.raw
  }
}

function withV1(path: string): string {
  if (path.startsWith("/health") || path.startsWith("/ready") || path.startsWith("/v1/")) {
    return path
  }
  return `/v1${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Cliente de API a usar en Server Components o Server Actions.
 * Inyecta el token de NextAuth automáticamente si existe la sesión.
 */
export async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await auth()
  const token = session?.user?.accessToken

  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // Forward Idempotency-Key if present
  if (options.headers instanceof Headers) {
    const idempotencyKey = options.headers.get("Idempotency-Key")
    if (idempotencyKey) {
      headers.set("Idempotency-Key", idempotencyKey)
    }
  } else if (typeof options.headers === "object" && options.headers) {
    const idempotencyKey = (options.headers as Record<string, string>)["Idempotency-Key"]
    if (idempotencyKey) {
      headers.set("Idempotency-Key", idempotencyKey)
    }
  }

  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL
  const normalizedPath = withV1(path)
  const url = `${baseUrl}${normalizedPath}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error"
    throw new ApiError(0, `Network error calling ${url}: ${msg}`)
  }

  const requestId = response.headers.get("X-Request-ID")

  if (!response.ok) {
    const contentType = response.headers.get("content-type")
    const isProblem = contentType?.includes("application/problem+json") ?? false
    let body: unknown = null

    try {
      body = await response.json()
    } catch {
      body = null
    }

    if (isProblem && body && typeof body === "object") {
      const problem = body as Partial<ProblemDetails>
      throw new ApiError(response.status, problem.title || problem.detail || "Error en la petición", {
        code: problem.code,
        title: problem.title,
        detail: problem.detail ?? null,
        instance: problem.instance ?? requestId ?? null,
        extra: Object.fromEntries(
          Object.entries(problem).filter(
            ([key]) => !["type", "title", "status", "code", "detail", "instance"].includes(key)
          )
        ),
        raw: body,
      })
    } else {
      const detail = body && typeof body === "object" && "detail" in body
        ? (body as { detail?: unknown }).detail
        : null
      const message = typeof detail === "string" ? detail : "Error en la petición"
      throw new ApiError(response.status, message, {
        detail: typeof detail === "string" ? detail : null,
        instance: requestId ?? null,
        raw: body,
      })
    }
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
