"use server"

import { revalidatePath } from "next/cache"
import { ApiError, fetchApi } from "@/lib/api-client"
import type {
  CredentialMetadataOut,
  CredentialTestOut,
  CredentialUpsertIn,
  MoabitsCompanyDiscoveryOut,
  MoabitsCompanySelectionIn,
} from "@/lib/types/api"

type ActionOk<T> = { ok: true; data: T }
type ActionErr = { ok: false; error: string; status?: number; code?: string }
export type CredentialActionResult<T> = ActionOk<T> | ActionErr

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
  try {
    const data = await fetchApi<CredentialMetadataOut[]>("/companies/me/credentials")
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function getCredential(provider: string): Promise<CredentialActionResult<CredentialMetadataOut>> {
  try {
    const data = await fetchApi<CredentialMetadataOut>(`/companies/me/credentials/${provider}`)
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function testCredential(
  provider: string,
  body: CredentialUpsertIn
): Promise<CredentialActionResult<CredentialTestOut>> {
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

export async function upsertCredential(
  provider: string,
  body: CredentialUpsertIn
): Promise<CredentialActionResult<CredentialMetadataOut>> {
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

export async function deactivateCredential(provider: string): Promise<CredentialActionResult<Record<string, never>>> {
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

export async function discoverMoabitsCompanies(): Promise<CredentialActionResult<MoabitsCompanyDiscoveryOut>> {
  try {
    const data = await fetchApi<MoabitsCompanyDiscoveryOut>(
      "/companies/me/credentials/moabits/companies/discover"
    )
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function selectMoabitsCompanyCodes(
  body: MoabitsCompanySelectionIn
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  try {
    const data = await fetchApi<CredentialMetadataOut>(
      "/companies/me/credentials/moabits/company-codes",
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    )
    revalidatePath("/dashboard/credentials")
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}
