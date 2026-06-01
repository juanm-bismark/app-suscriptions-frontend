import Link from "next/link"
import { notFound } from "next/navigation"
import { getCompanyById } from "@/app/actions/company"
import { getCompanyCredential } from "@/app/actions/credentials"
import { requireAdmin } from "@/lib/auth/current-user"
import { formatDate } from "@/lib/utils"
import type { CredentialExpiryStatus, Provider } from "@/lib/types/api"
import { Badge } from "@/components/ui"
import { WarningAlert } from "../../../../_components/alerts"
import { CredentialForm } from "../../../credential-form"
import { isProvider, providerName } from "../../../credential-utils"

function StatusBadge({ active, expiry }: { active: boolean; expiry: CredentialExpiryStatus }) {
  if (!active) return <Badge variant="secondary">Inactiva</Badge>
  if (expiry === "expired") return <Badge variant="destructive">Expirada</Badge>
  if (expiry === "expiring") return (
    <Badge className="border-warning-border-soft bg-warning-soft text-warning-text-soft">Por vencer</Badge>
  )
  return <Badge variant="success">Activa</Badge>
}

export default async function AdminCompanyCredentialPage({
  params,
}: {
  params: Promise<{ companyId: string; provider: string }>
}) {
  await requireAdmin()
  const { companyId, provider: rawProvider } = await params
  if (!isProvider(rawProvider)) notFound()

  const provider: Provider = rawProvider
  const [companyResult, credentialResult] = await Promise.all([
    getCompanyById(companyId),
    getCompanyCredential(companyId, provider),
  ])
  const credential = credentialResult.ok ? credentialResult.data : null
  const companyName = companyResult.success ? companyResult.company.name : companyId

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

      {/* Header */}
      <div className="mb-5">
        <Link
          className="text-sm font-medium text-header-bg hover:underline"
          href={`/dashboard/credentials?companyId=${companyId}`}
        >
          ← Volver a credenciales
        </Link>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-title">{providerName(provider)}</h1>
            <p className="mt-1 text-muted text-sm">{companyName}</p>
          </div>
          {credential && (
            <div className="shrink-0 pt-0.5">
              <StatusBadge active={credential.active} expiry={credential.expiry_status} />
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {companyResult.error && (
        <WarningAlert className="mb-5">
          {companyResult.error}
        </WarningAlert>
      )}
      {!credentialResult.ok && credentialResult.status !== 404 && (
        <WarningAlert className="mb-5">
          {credentialResult.error}
        </WarningAlert>
      )}

      {/* Metadata strip */}
      {credential && (
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-lg bg-white/60 px-4 py-3 text-xs shadow-sm shadow-header-top/5">
          <span className="text-muted">
            <span className="font-semibold text-title">Creada</span>{" "}
            {formatDate(credential.created_at)}
          </span>
          {credential.rotated_at && (
            <span className="text-muted">
              <span className="font-semibold text-title">Última rotación</span>{" "}
              {formatDate(credential.rotated_at)}
            </span>
          )}
          {!credential.rotated_at && (
            <span className="text-muted italic">Sin rotaciones registradas</span>
          )}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-lg bg-accent-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <CredentialForm provider={provider} credential={credential} companyId={companyId} />
      </div>
    </div>
  )
}
