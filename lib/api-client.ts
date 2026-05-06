import { auth } from "@/auth"

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
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

  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
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

  // Si es error de credenciales, puedes querer manejar refresh tokens si los tienes,
  // por ahora si es 401 simplemente lanzamos el error o se redirige a login.
  if (!response.ok) {
    let message = "Error en la petición"
    try {
      const errorData = await response.json()
      message = errorData.detail || errorData.message || message
    } catch {
      // Ignore si no es JSON
    }
    throw new ApiError(response.status, message)
  }

  // Devolver data en JSON o texto vacío
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
