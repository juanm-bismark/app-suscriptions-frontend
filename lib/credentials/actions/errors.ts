import { invalidActionError, retryAfterSeconds, toActionError, type ActionErr } from "@/lib/actions/errors"
import { ApiError } from "@/lib/api-client"
import type { CredentialProbeOut, CredentialTestOut } from "@/lib/types/api"
import type { CredentialActionResult } from "./types"

const adminProbeMessages: Record<string, string> = {
  "tenant.credentials_missing": "No hay credenciales activas para este proveedor.",
  "subscription.listing_precondition_failed": "No se puede probar: falta una configuración requerida. Para Moabits, revisa la vinculación de compañía.",
  "provider.auth_failed": "Autenticación fallida en el proveedor.",
  "provider.protocol_error": "El proveedor respondió con un formato inesperado.",
  "provider.unavailable": "El proveedor no está disponible temporalmente.",
  "provider.rate_limited": "Rate limit del proveedor. Reintenta más tarde.",
}

export function invalidProviderError(): ActionErr {
  return invalidActionError("Proveedor invalido", "invalid_provider")
}

export function toCredentialTestResult(data: CredentialTestOut): CredentialActionResult<CredentialTestOut> {
  if (!data.ok) {
    return {
      ok: false,
      error: data.detail || "Credenciales invalidas",
      status: 422,
      code: "credential_test_failed",
    }
  }

  return { ok: true, data }
}

export function toCredentialProbeResult(data: CredentialProbeOut): CredentialActionResult<CredentialProbeOut> {
  if (!data.ok) {
    return {
      ok: false,
      error: data.detail || "No se pudieron probar las credenciales",
      status: 422,
      code: "credential_probe_failed",
    }
  }

  return { ok: true, data }
}

export function toAdminProbeError(error: unknown): ActionErr {
  if (error instanceof ApiError) {
    const retryAfter = retryAfterSeconds(error)
    const mappedMessage = error.code ? adminProbeMessages[error.code] : undefined
    const message =
      error.code === "provider.rate_limited" && retryAfter != null
        ? `Rate limit del proveedor. Reintenta en ${retryAfter}s.`
        : mappedMessage ?? error.detail ?? error.title ?? error.message

    return { ok: false, error: message, status: error.status, code: error.code }
  }

  return toActionError(error)
}

export function toStoredProbeError(error: ApiError): ActionErr {
  const retryAfter = retryAfterSeconds(error)
  const message =
    error.code === "provider.rate_limited" && retryAfter != null
      ? `Rate limit del proveedor. Reintenta en ${retryAfter}s.`
      : error.code === "tenant.credentials_missing"
        ? "Faltan credenciales activas para este proveedor."
        : error.code === "subscription.listing_precondition_failed"
          ? "Falta una precondición (p.ej. vinculación Moabits)."
          : error.code === "provider.auth_failed"
            ? "Autenticación rechazada por el proveedor."
            : error.code === "provider.protocol_error"
              ? "Respuesta inesperada del proveedor."
              : error.code === "provider.unavailable"
                ? "Proveedor temporalmente no disponible."
                : error.detail || error.title || error.message

  return { ok: false, error: message, status: error.status, code: error.code }
}

