import { revalidatePath } from "next/cache"
import { toActionError } from "@/lib/actions/errors"
import { fetchApi } from "@/lib/api-client"
import { requireAdmin } from "@/lib/auth/current-user"
import { isProvider } from "@/lib/provider-meta"
import { invalidProviderError } from "./errors"
import type { CredentialActionResult } from "./types"

export async function deactivateCredentialAction(
  provider: string,
): Promise<CredentialActionResult<Record<string, never>>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    await fetchApi(`/companies/me/credentials/${provider}`, {
      method: "DELETE",
    })
    revalidatePath("/dashboard/credentials")
    return { ok: true, data: {} }
  } catch (error) {
    return toActionError(error)
  }
}

export async function deactivateCompanyCredentialAction(
  companyId: string,
  provider: string,
): Promise<CredentialActionResult<Record<string, never>>> {
  await requireAdmin()
  if (!isProvider(provider)) return invalidProviderError()

  try {
    await fetchApi(`/admin/companies/${companyId}/credentials/${provider}`, {
      method: "DELETE",
    })
    revalidatePath("/dashboard/credentials")
    revalidatePath(`/dashboard/credentials/company/${companyId}/${provider}`)
    return { ok: true, data: {} }
  } catch (error) {
    return toActionError(error)
  }
}

