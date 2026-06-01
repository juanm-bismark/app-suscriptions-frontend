import { toActionError } from "@/lib/actions/errors"
import { fetchApi } from "@/lib/api-client"
import { CredentialMetadataOutSchema } from "@/lib/api-validation"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import { isProvider } from "@/lib/provider-meta"
import type { CredentialMetadataOut } from "@/lib/types/api"
import { invalidProviderError } from "./errors"
import type { CredentialActionResult } from "./types"

export async function listCredentialsAction(): Promise<CredentialActionResult<CredentialMetadataOut[]>> {
  await requireManagerOrAdmin()
  try {
    const data = await fetchApi("/companies/me/credentials", {
      schema: CredentialMetadataOutSchema.array(),
      cache: "no-store",
    })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function listCompanyCredentialsAction(
  companyId: string,
): Promise<CredentialActionResult<CredentialMetadataOut[]>> {
  await requireAdmin()
  try {
    const data = await fetchApi(`/admin/companies/${companyId}/credentials`, {
      schema: CredentialMetadataOutSchema.array(),
      cache: "no-store",
    })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function getCredentialAction(provider: string): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireManagerOrAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi(`/companies/me/credentials/${provider}`, {
      schema: CredentialMetadataOutSchema,
      cache: "no-store",
    })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function getCompanyCredentialAction(
  companyId: string,
  provider: string,
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi(`/admin/companies/${companyId}/credentials/${provider}`, {
      schema: CredentialMetadataOutSchema,
      cache: "no-store",
    })
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

