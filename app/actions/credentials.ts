"use server"

import { revalidatePath } from "next/cache"
import { ApiError, fetchApi } from "@/lib/api-client"
import { listSims } from "@/lib/api/sims"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import type {
  CredentialMetadataOut,
  CredentialProbeOut,
  CredentialTestOut,
  CredentialUpsertIn,
  Provider,
} from "@/lib/types/api"

type ActionOk<T> = { ok: true; data: T }
type ActionErr = { ok: false; error: string; status?: number; code?: string }
export type CredentialActionResult<T> = ActionOk<T> | ActionErr

const ALLOWED_PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

function isProvider(value: string): value is Provider {
  return ALLOWED_PROVIDERS.includes(value as Provider)
}

function invalidProviderError(): ActionErr {
  return { ok: false, error: "Proveedor invalido", status: 422, code: "invalid_provider" }
}

function toActionError(error: unknown): ActionErr {
  if (error instanceof ApiError) {
    return {
      ok: false,
      error: error.detail || error.message || "No se pudo completar la operación",
      status: error.status,
      code: error.code,
    }
  }

  return {
    ok: false,
    error: error instanceof Error ? error.message : "No se pudo completar la operación",
  }
}

function toCredentialTestResult(data: CredentialTestOut): CredentialActionResult<CredentialTestOut> {
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

function toCredentialProbeResult(data: CredentialProbeOut): CredentialActionResult<CredentialProbeOut> {
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

const adminProbeMessages: Record<string, string> = {
  "tenant.credentials_missing": "No hay credenciales activas para este proveedor.",
  "subscription.listing_precondition_failed": "No se puede probar: falta una configuración requerida. Para Moabits, revisa la vinculación de compañía.",
  "provider.auth_failed": "Autenticación fallida en el proveedor.",
  "provider.protocol_error": "El proveedor respondió con un formato inesperado.",
  "provider.unavailable": "El proveedor no está disponible temporalmente.",
  "provider.rate_limited": "Rate limit del proveedor. Reintenta más tarde.",
}

function retryAfterSeconds(error: ApiError) {
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

function toAdminProbeError(error: unknown): ActionErr {
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

export async function listCredentials(): Promise<CredentialActionResult<CredentialMetadataOut[]>> {
  await requireManagerOrAdmin()
  try {
    const data = await fetchApi<CredentialMetadataOut[]>("/companies/me/credentials", { cache: "no-store" })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function listCompanyCredentials(companyId: string): Promise<CredentialActionResult<CredentialMetadataOut[]>> {
  await requireAdmin()
  try {
    const data = await fetchApi<CredentialMetadataOut[]>(`/admin/companies/${companyId}/credentials`, { cache: "no-store" })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function getCredential(provider: string): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireManagerOrAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<CredentialMetadataOut>(`/companies/me/credentials/${provider}`, { cache: "no-store" })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function getCompanyCredential(
  companyId: string,
  provider: string
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<CredentialMetadataOut>(`/admin/companies/${companyId}/credentials/${provider}`, { cache: "no-store" })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function testCredential(
  provider: string,
  body: CredentialUpsertIn
): Promise<CredentialActionResult<CredentialTestOut>> {
  await requireManagerOrAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<CredentialTestOut>(`/companies/me/credentials/${provider}/test`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    return toCredentialTestResult(data)
  } catch (error) {
    return toActionError(error)
  }
}

export async function testCompanyCredential(
  companyId: string,
  provider: string,
  body: CredentialUpsertIn
): Promise<CredentialActionResult<CredentialTestOut>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<CredentialTestOut>(`/admin/companies/${companyId}/credentials/${provider}/test`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    return toCredentialTestResult(data)
  } catch (error) {
    return toActionError(error)
  }
}

export async function upsertCredential(
  provider: string,
  body: CredentialUpsertIn
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireManagerOrAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<CredentialMetadataOut>(`/companies/me/credentials/${provider}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
    revalidatePath("/dashboard/credentials")
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function upsertCompanyCredential(
  companyId: string,
  provider: string,
  body: CredentialUpsertIn
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<CredentialMetadataOut>(`/admin/companies/${companyId}/credentials/${provider}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
    revalidatePath("/dashboard/credentials")
    revalidatePath(`/dashboard/credentials/company/${companyId}/${provider}`)
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function probeCompanyCredential(
  companyId: string,
  provider: string
): Promise<CredentialActionResult<CredentialProbeOut>> {
  await requireAdmin()
  if (!companyId) {
    return { ok: false, error: "Empresa invalida", status: 422, code: "invalid_company" }
  }
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<CredentialProbeOut>(
      `/admin/companies/${companyId}/credentials/${provider}/probe`,
      { method: "POST", cache: "no-store" }
    )
    return toCredentialProbeResult(data)
  } catch (error) {
    return toAdminProbeError(error)
  }
}

/**
 * Probe the *stored* credential for the caller's company by listing 1 SIM
 * through the provider. Used to "kick the tires" on saved credentials
 * without re-entering secrets — the /test endpoint can't help here because
 * secret fields are never returned by any GET, so we can't reconstruct
 * a full candidate body.
 *
 * Only meaningful for the caller's own company — there is no admin-scoped
 * sims endpoint, so this is wired only on the manager/admin own-company view.
 */
export async function probeStoredCredential(
  provider: string
): Promise<CredentialActionResult<{ detail: string }>> {
  await requireManagerOrAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const result = await listSims({ provider, limit: 1 })
    const failed = result.failed_providers?.find((entry) => entry.provider === provider)
    if (failed) {
      return {
        ok: false,
        error: failed.title || failed.code,
        code: failed.code,
      }
    }

    const sample = result.items?.length ?? 0
    const total = result.total
    const detail = total != null
      ? `${total} SIM${total === 1 ? "" : "s"} accesible${total === 1 ? "" : "s"}.`
      : sample > 0
        ? `Conexión OK. Muestra: ${sample} SIM en la primera página.`
        : "Conexión OK. No hay SIMs en la primera página."

    return { ok: true, data: { detail } }
  } catch (error) {
    if (error instanceof ApiError) {
      const retryAfter = typeof error.extra?.retry_after === "number" ? error.extra.retry_after : undefined
      const message = error.code === "provider.rate_limited" && retryAfter
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
    return toActionError(error)
  }
}

export async function deactivateCredential(provider: string): Promise<CredentialActionResult<Record<string, never>>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<Record<string, never>>(`/companies/me/credentials/${provider}`, {
      method: "DELETE",
    })
    revalidatePath("/dashboard/credentials")
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function deactivateCompanyCredential(
  companyId: string,
  provider: string
): Promise<CredentialActionResult<Record<string, never>>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi<Record<string, never>>(`/admin/companies/${companyId}/credentials/${provider}`, {
      method: "DELETE",
    })
    revalidatePath("/dashboard/credentials")
    revalidatePath(`/dashboard/credentials/company/${companyId}/${provider}`)
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}
