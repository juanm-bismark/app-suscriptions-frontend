import Link from "next/link"
import { Plus } from "lucide-react"
import type { CredentialMetadataOut, Provider } from "@/lib/types/api"
import type { Company } from "@/lib/types/user"
import { SourceBadge } from "@/app/dashboard/_components/source-badge"
import { dashboardStyles } from "@/app/dashboard/_components/dashboard-styles"
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { PendingLinkButton } from "@/app/dashboard/_components/pending-link-button"
import { DeleteCredentialButton } from "../delete-credential-button"
import { TestCredentialButton } from "../test-credential-button"
import { EXPIRY_META, PROVIDERS, formatDate, providerName, scopeValue } from "../credential-utils"

export function CredentialExpiryBadge({ status }: { status: CredentialMetadataOut["expiry_status"] }) {
  const item = EXPIRY_META[status] ?? EXPIRY_META.invalid

  return (
    <Badge
      variant="outline"
      style={{
        background: item.meta.bg,
        color: item.meta.color,
        border: "none",
      }}
    >
      {item.label}
    </Badge>
  )
}

export function CompanyCredentialLink({
  company,
  query,
  page,
  size,
  selected,
}: {
  company: Company
  query: string
  page: number
  size: number
  selected: boolean
}) {
  const params = new URLSearchParams({
    companyId: company.id,
    page: String(page),
    size: String(size),
  })
  if (query) params.set("q", query)

  return (
    <Link
      href={`/dashboard/credentials?${params.toString()}`}
      className={`block rounded-md px-3 py-3 text-sm shadow-sm shadow-header-top/5 ${
        selected ? "bg-accent-soft text-title" : "bg-white/75 text-muted hover:bg-white hover:text-title"
      }`}
    >
      <span className="block truncate font-semibold">{company.name}</span>
    </Link>
  )
}

export function CredentialsTable({
  byProvider,
  companyId,
}: {
  byProvider: Map<string, CredentialMetadataOut>
  companyId?: string
}) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden [&>div]:h-full">
      <Table className="h-full min-w-[760px]">
        <TableHeader className={dashboardStyles.tableHeader}>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="h-12 py-3 align-middle">Proveedor</TableHead>
            <TableHead className="h-12 py-3 align-middle">Estado</TableHead>
            <TableHead className="h-12 py-3 align-middle">Vigencia</TableHead>
            <TableHead className="h-12 py-3 align-middle">Scope</TableHead>
            <TableHead className="h-12 py-3 align-middle">Rotacion</TableHead>
            <TableHead className="h-12 py-3 text-right align-middle">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PROVIDERS.map((provider) => {
            const credential = byProvider.get(provider)
            const href = credentialHref(provider, companyId)

            return (
              <TableRow key={provider} className="h-20 border-0 hover:bg-white/65">
                <TableCell className="min-w-32 py-4 align-middle font-medium text-title">
                  <SourceBadge source={provider} withName />
                </TableCell>
                <TableCell className="py-4 align-middle">
                  {credential?.active ? (
                    <Badge variant="success">Activa</Badge>
                  ) : (
                    <Badge variant="secondary">Sin configurar</Badge>
                  )}
                </TableCell>
                <TableCell className="py-4 align-middle">
                  {credential ? <CredentialExpiryBadge status={credential.expiry_status} /> : "No aplica"}
                </TableCell>
                <TableCell className="py-4 align-middle text-muted">
                  {credential
                    ? provider === "tele2"
                      ? scopeValue(credential.account_scope, "account_id")
                      : scopeValue(credential.account_scope, "environment")
                    : "No definido"}
                </TableCell>
                <TableCell className="py-4 align-middle text-muted">{formatDate(credential?.rotated_at)}</TableCell>
                <TableCell className="py-4 align-middle">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    {credential?.active && (
                      <TestCredentialButton provider={provider} companyId={companyId} />
                    )}
                    <PendingLinkButton className={`${dashboardStyles.primaryAction} h-9 px-3`} href={href}>
                      {credential?.active ? "Editar" : "Agregar"}
                    </PendingLinkButton>
                    {credential?.active && companyId && (
                      <DeleteCredentialButton provider={provider} companyId={companyId} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function AddCredentialActions({
  missingProviders,
  companyId,
  className,
}: {
  missingProviders: Provider[]
  companyId?: string
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? "mt-3"}`}>
      {missingProviders.length > 0 ? (
        <>
          <span className="text-sm font-medium text-muted">Agregar:</span>
          {missingProviders.map((provider) => (
            <PendingLinkButton
              key={provider}
              href={credentialHref(provider, companyId)}
              className={`${dashboardStyles.primaryAction} h-8 px-2.5 text-sm`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {providerName(provider)}
            </PendingLinkButton>
          ))}
        </>
      ) : (
        <span className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-muted shadow-sm shadow-header-top/5">
          Todas configuradas
        </span>
      )}
    </div>
  )
}

export function credentialHref(provider: Provider, companyId?: string) {
  return companyId ? `/dashboard/credentials/company/${companyId}/${provider}` : `/dashboard/credentials/${provider}`
}
