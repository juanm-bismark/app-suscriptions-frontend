import { actionErrorMessage } from "@/lib/action-error"
import { ApiError } from "@/lib/api-client"

export type ActionOk<T> = { ok: true; data: T }
export type ActionErr = { ok: false; error: string; status?: number; code?: string; reason?: string }
export type ActionResult<T> = ActionOk<T> | ActionErr

export function invalidActionError(error: string, code: string, status = 422): ActionErr {
  return { ok: false, error, status, code }
}

export function toActionError(error: unknown, fallback = "No se pudo completar la operación"): ActionErr {
  if (error instanceof ApiError) {
    const reason = typeof error.extra?.reason === "string" ? error.extra.reason : undefined
    return {
      ok: false,
      error: actionErrorMessage(error, fallback),
      status: error.status,
      code: error.code,
      reason,
    }
  }

  return {
    ok: false,
    error: actionErrorMessage(error, fallback),
  }
}

export function retryAfterSeconds(error: ApiError) {
  const nestedExtra = error.extra?.extra
  const nestedRetryAfter =
    nestedExtra && typeof nestedExtra === "object" && "retry_after" in nestedExtra
      ? (nestedExtra as Record<string, unknown>).retry_after
      : undefined
  const value = error.retryAfter ?? error.extra?.retry_after ?? nestedRetryAfter
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}
