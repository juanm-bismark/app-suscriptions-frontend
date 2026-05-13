import Link from "next/link"
import { notFound } from "next/navigation"
import { getCredential } from "@/app/actions/credentials"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import type { Provider } from "@/lib/types/api"
import { ROLES } from "@/lib/types/user"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <Link className="text-sm font-medium text-header-bg hover:underline" href="/dashboard/credentials">
          Volver a credenciales
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-title">{providerName(provider)}</h1>
        <p className="text-muted">Configura, prueba y guarda las credenciales del proveedor.</p>
      </div>

      {!result.ok && result.status !== 404 && (
        <div className="mb-6 rounded-lg bg-[#FFF7E7] p-4 text-sm text-[#6D4D16] shadow-sm shadow-warn-bg/5">
          {result.error}
        </div>
      )}

      <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
        <CredentialForm provider={provider} credential={credential} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
