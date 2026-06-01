import { revalidatePath } from "next/cache"
import { toActionError } from "@/lib/actions/errors"
import { fetchApi } from "@/lib/api-client"
import { CredentialMetadataOutSchema } from "@/lib/api-validation"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import { isProvider } from "@/lib/provider-meta"
import type { CredentialMetadataOut, CredentialUpsertIn } from "@/lib/types/api"
import { invalidProviderError } from "./errors"
import type { CredentialActionResult } from "./types"

export async function upsertCredentialAction(
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireManagerOrAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi(`/companies/me/credentials/${provider}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      schema: CredentialMetadataOutSchema,
    })
    revalidatePath("/dashboard/credentials")
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

export async function upsertCompanyCredentialAction(
  companyId: string,
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    const data = await fetchApi(`/admin/companies/${companyId}/credentials/${provider}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      schema: CredentialMetadataOutSchema,
    })
    revalidatePath("/dashboard/credentials")
    revalidatePath(`/dashboard/credentials/company/${companyId}/${provider}`)
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}

