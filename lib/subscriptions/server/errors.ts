import { ApiError } from "@/lib/api-client"
import type { FailedProvider, ActionProblem } from "@/lib/subscriptions/types"
import type { Provider } from "@/lib/types/api"
export { dedupeFailedProviders } from "@/lib/subscriptions/result-utils"

export function actionProblem(error: unknown, fallback: string): ActionProblem {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      title: error.title,
      detail: error.detail || error.message || fallback,
      retryAfter: error.retryAfter,
    }
  }
  return {
    status: 0,
    detail: error instanceof Error ? error.message : fallback,
  }
}

export function toFailedProvider(provider: Provider, error: unknown): FailedProvider {
  if (error instanceof ApiError) {
    return {
      provider,
      code: error.code || "provider.unavailable",
      title: error.detail || error.title || error.message || "No se pudo consultar",
    }
  }
  return {
    provider,
    code: "provider.unavailable",
    title: error instanceof Error ? error.message : "No se pudo consultar",
  }
}

export function readFailedProviders(value: unknown): FailedProvider[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const provider = "provider" in item && typeof item.provider === "string" ? item.provider : null
    const code = "code" in item && typeof item.code === "string" ? item.code : "provider.unavailable"
    const title = "title" in item && typeof item.title === "string" ? item.title : "No se pudo consultar"
    return provider ? [{ provider, code, title }] : []
  })
}
