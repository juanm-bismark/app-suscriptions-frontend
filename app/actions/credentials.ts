"use server"

import { revalidatePath } from "next/cache"
import { ApiError, fetchApi } from "@/lib/api-client"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import type {
  CredentialMetadataOut,
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
    return { ok: true, data }
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
    return { ok: true, data }
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

