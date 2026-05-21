import Link from "next/link"
import { notFound } from "next/navigation"
import { getCredential } from "@/app/actions/credentials"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import type { Provider } from "@/lib/types/api"
import { ROLES } from "@/lib/types/user"
import { WarningAlert } from "../../_components/alerts"
import { CredentialForm } from "../credential-form"
import { isProvider, providerName } from "../credential-utils"

export default async function ProviderCredentialPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const profile = await requireManagerOrAdmin()
  const isAdmin = profile.role === ROLES.ADMIN
  const { provider: rawProvider } = await params
  if (!isProvider(rawProvider) || rawProvider === "moabits") notFound()

  const provider: Provider = rawProvider
  const result = await getCredential(provider)
  const credential = result.ok ? result.data : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      <div className="mb-5">
        <Link className="text-sm font-medium text-header-bg hover:underline" href="/dashboard/credentials">
          Volver a credenciales
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-title">{providerName(provider)}</h1>
        <p className="text-muted">Configura, prueba y guarda las credenciales del proveedor.</p>
      </div>

      {!result.ok && result.status !== 404 && (
        <WarningAlert className="mb-6">
          {result.error}
        </WarningAlert>
      )}

      <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-5 sm:p-6">
        <CredentialForm provider={provider} credential={credential} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
