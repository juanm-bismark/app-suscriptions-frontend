import { toActionError } from "@/lib/actions/errors"
import { listSims } from "@/lib/api/sims"
import { ApiError, fetchApi } from "@/lib/api-client"
import { CredentialProbeOutSchema, CredentialTestOutSchema } from "@/lib/api-validation"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import { isProvider } from "@/lib/provider-meta"
import type { CredentialProbeOut, CredentialTestOut, CredentialUpsertIn } from "@/lib/types/api"
import {
  invalidProviderError,
  toAdminProbeError,
  toCredentialProbeResult,
  toCredentialTestResult,
  toStoredProbeError,
} from "./errors"
import type { CredentialActionResult } from "./types"

export async function testCredentialAction(
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialTestOut>> {
  await requireManagerOrAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi(`/companies/me/credentials/${provider}/test`, {
      method: "POST",
      body: JSON.stringify(body),
      schema: CredentialTestOutSchema,
    })
    return toCredentialTestResult(data)
  } catch (error) {
    return toActionError(error)
  }
}

export async function testCompanyCredentialAction(
  companyId: string,
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialTestOut>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi(`/admin/companies/${companyId}/credentials/${provider}/test`, {
      method: "POST",
      body: JSON.stringify(body),
      schema: CredentialTestOutSchema,
    })
    return toCredentialTestResult(data)
  } catch (error) {
    return toActionError(error)
  }
}

export async function probeCompanyCredentialAction(
  companyId: string,
  provider: string,
): Promise<CredentialActionResult<CredentialProbeOut>> {
  await requireAdmin()
  if (!companyId) {
    return { ok: false, error: "Empresa invalida", status: 422, code: "invalid_company" }
  }
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi(`/admin/companies/${companyId}/credentials/${provider}/probe`, {
      method: "POST",
      cache: "no-store",
      schema: CredentialProbeOutSchema,
    })
    return toCredentialProbeResult(data)
  } catch (error) {
    return toAdminProbeError(error)
  }
}

export async function probeStoredCredentialAction(
  provider: string,
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
    const detail =
      total != null
        ? `${total} SIM${total === 1 ? "" : "s"} accesible${total === 1 ? "" : "s"}.`
        : sample > 0
          ? `Conexión OK. Muestra: ${sample} SIM en la primera página.`
          : "Conexión OK. No hay SIMs en la primera página."

    return { ok: true, data: { detail } }
  } catch (error) {
    if (error instanceof ApiError) {
      return toStoredProbeError(error)
    }
    return toActionError(error)
  }
}

