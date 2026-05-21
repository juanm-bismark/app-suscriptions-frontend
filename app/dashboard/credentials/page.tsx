import Link from "next/link"
import { listCompanyCredentials, listCredentials } from "@/app/actions/credentials"
import { searchCompanies } from "@/app/actions/company"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { positiveInt } from "@/lib/utils"
import type { CredentialMetadataOut, Provider } from "@/lib/types/api"
import { ROLES, type Company } from "@/lib/types/user"
import { KeyRound, Plus, X } from "lucide-react"
import { SourceBadge } from "@/app/dashboard/subscriptions/primitives"
import { Alert, AlertDescription, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { PendingLinkButton } from "../_components/pending-link-button"
import { SearchSubmitButton } from "../_components/search-submit-button"
import { PageHeader } from "../_components/page-header"
import { WarningAlert } from "../_components/alerts"
import { CompanyPaginationControls } from "./company-pagination-controls"
import { EXPIRY_META, PROVIDERS, formatDate, providerName, scopeValue } from "./credential-utils"
import { AdminAddCredentialDialog } from "./admin-add-credential-dialog"
import { DeleteCredentialButton } from "./delete-credential-button"
import { TestCredentialButton } from "./test-credential-button"

type CredentialsPageProps = {
  searchParams?: Promise<{ companyId?: string; q?: string; page?: string; size?: string }>
}

function CredentialExpiryBadge({ status }: { status: CredentialMetadataOut["expiry_status"] }) {
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

export default async function CredentialsPage({ searchParams }: CredentialsPageProps) {
  const profile = await requireManagerOrAdmin()
  const params = await searchParams

  if (profile.role === ROLES.ADMIN) {
    return <AdminCredentialsPage searchParams={params} />
  }

  return <ScopedCredentialsPage />
}

async function ScopedCredentialsPage() {
  const result = await listCredentials()
  const credentials = result.ok ? result.data : []
  const byProvider = new Map(credentials.map((credential) => [credential.provider, credential]))
  const activeCredentials = credentials.filter((credential) => credential.active).length
  const missingProviders = PROVIDERS.filter((provider) => !byProvider.get(provider)?.active)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-title mb-2">Credenciales</h1>
            <p className="text-muted">Administra los accesos de proveedor usados para sincronizar y operar SIMs.</p>
            <AddCredentialActions missingProviders={missingProviders} />
          </div>
          <div className="flex max-w-full items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:max-w-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Proveedores</p>
              <p className="truncate text-sm font-semibold text-title">{activeCredentials}/{PROVIDERS.length} configurados</p>
            </div>
          </div>
        </div>
      </div>

      {!result.ok && (
        <WarningAlert className="mb-6">
          {result.error}
        </WarningAlert>
      )}

      <Card className="overflow-hidden border-0 bg-[#F5FAFA] shadow-sm shadow-header-top/5">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-[#EAF6F7]">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead>Proveedor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Rotacion</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {PROVIDERS.map((provider) => {
                const credential = byProvider.get(provider)
                const href = `/dashboard/credentials/${provider}`

                return (
                  <TableRow key={provider} className="h-20 border-0 hover:bg-white/65">
                    <TableCell className="min-w-32 py-4 align-middle font-medium text-title">
                      <SourceBadge source={provider} withName />
                    </TableCell>
                    <TableCell className="py-4 align-middle">
                      {credential?.active ? (
                        <Badge variant="success">
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Sin configurar
                        </Badge>
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
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        {credential?.active && <TestCredentialButton provider={provider} />}
                        <PendingLinkButton className="inline-flex h-9 items-center rounded-md bg-[#0F202A] px-3 text-sm font-semibold text-white hover:bg-[#163C41]" href={href}>
                          {credential?.active ? "Editar" : "Agregar"}
                        </PendingLinkButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

async function AdminCredentialsPage({
  searchParams,
}: {
  searchParams?: { companyId?: string; q?: string; page?: string; size?: string }
}) {
  const currentPage = positiveInt(searchParams?.page, 1)
  const pageSize = positiveInt(searchParams?.size, 20)
  const query = searchParams?.q?.trim() ?? ""
  const selectedCompanyId = searchParams?.companyId ?? null
  const companiesResult = await searchCompanies({ q: query, page: currentPage, size: pageSize })
  const companies = companiesResult.success ? companiesResult.companies : []
  const selectedCompany =
    selectedCompanyId ? companies.find((company) => company.id === selectedCompanyId) ?? null : companies[0] ?? null
  const selectedId = selectedCompany?.id ?? (query ? null : selectedCompanyId)
  const credentialResult = selectedId
    ? await listCompanyCredentials(selectedId)
    : ({ ok: true, data: [] } as const)
  const credentials = credentialResult.ok ? credentialResult.data : []
  const byProvider = new Map(credentials.map((credential) => [credential.provider, credential]))
  const activeCredentials = credentials.filter((credential) => credential.active).length
  const missingProviders = PROVIDERS.filter((provider) => !byProvider.get(provider)?.active)
  const clearSearchParams = new URLSearchParams({ page: "1", size: String(pageSize) })
  if (selectedId) clearSearchParams.set("companyId", selectedId)
  const clearSearchHref = `/dashboard/credentials?${clearSearchParams.toString()}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-title mb-2">Credenciales</h1>
            <p className="text-muted">Administra credenciales por empresa para toda la plataforma.</p>
            <div className="mt-4">
              <AdminAddCredentialDialog />
            </div>
          </div>
          <div className="flex max-w-full items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:max-w-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Empresa seleccionada</p>
              <p className="truncate text-sm font-semibold text-title">
                {selectedCompany?.name ?? selectedId ?? "Sin seleccionar"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {companiesResult.error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{companiesResult.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 min-[480px]:grid-cols-[200px_minmax(0,1fr)] sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="border-0 bg-[#F5FAFA] p-4 shadow-sm shadow-header-top/5 sm:p-5 md:self-center">
          <h2 className="text-xl font-semibold text-title">Empresas</h2>
          <form className="mt-4 flex flex-col gap-2" action="/dashboard/credentials" method="get">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="size" value={pageSize} />
            <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-[#C9DFE3] bg-white px-2.5 shadow-sm shadow-header-top/5 focus-within:ring-2 focus-within:ring-header-accent">
              <input
                name="q"
                defaultValue={query}
                placeholder="Buscar empresa..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-title outline-none placeholder:text-muted"
              />
              {query && (
                <Link
                  href={clearSearchHref}
                  title="Limpiar busqueda"
                  aria-label="Limpiar busqueda"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-[#EAF6F7] hover:text-title"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
            <SearchSubmitButton className="h-8 px-3 py-0 text-xs" loadingText="Buscando...">
              Buscar
            </SearchSubmitButton>
          </form>

          <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto">
            {companies.length > 0 ? (
              companies.map((company) => (
                <CompanyCredentialLink
                  key={company.id}
                  company={company}
                  query={query}
                  page={currentPage}
                  size={pageSize}
                  selected={company.id === selectedId}
                />
              ))
            ) : (
              <p className="rounded-md bg-white/70 p-4 text-sm text-muted shadow-sm shadow-header-top/5">
                No se encontraron empresas.
              </p>
            )}
          </div>
          {companiesResult.success && (
            <CompanyPaginationControls
              page={companiesResult.page}
              pages={companiesResult.pages}
              size={companiesResult.size}
              total={companiesResult.total}
              query={query}
              companyId={selectedId}
            />
          )}
        </Card>

        <Card className="flex min-h-[calc(100vh-22rem)] flex-col overflow-hidden border-0 bg-[#F5FAFA] shadow-sm shadow-header-top/5">
          <div className="border-b border-[#D8E7EA] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-title">
                  {selectedCompany?.name ?? selectedId ?? "Selecciona una empresa"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-muted shadow-sm shadow-header-top/5">
                  {activeCredentials}/{PROVIDERS.length} proveedores configurados
                </span>
                {selectedId && (
                  <AddCredentialActions
                    missingProviders={missingProviders}
                    companyId={selectedId}
                    className="mt-0"
                  />
                )}
              </div>
            </div>
          </div>

          {!credentialResult.ok && (
            <Alert className="m-5 sm:m-6" variant="destructive">
              <AlertDescription>{credentialResult.error}</AlertDescription>
            </Alert>
          )}

          {selectedId ? (
            <CredentialsTable key={`${query}:${selectedId}`} byProvider={byProvider} companyId={selectedId} />
          ) : (
            <div className="flex flex-1 items-center p-6 text-sm text-muted">
              Selecciona una empresa para ver sus credenciales.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function CompanyCredentialLink({
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
        selected ? "bg-[#DDF1F2] text-title" : "bg-white/75 text-muted hover:bg-white hover:text-title"
      }`}
    >
      <span className="block truncate font-semibold">{company.name}</span>
    </Link>
  )
}

function CredentialsTable({
  byProvider,
  companyId,
}: {
  byProvider: Map<string, CredentialMetadataOut>
  companyId?: string
}) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden [&>div]:h-full">
      <Table className="h-full min-w-[760px]">
        <TableHeader className="bg-[#EAF6F7]">
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
                    {credential?.active && companyId && (
                      <TestCredentialButton provider={provider} companyId={companyId} />
                    )}
                    <PendingLinkButton className="inline-flex h-9 items-center rounded-md bg-[#0F202A] px-3 text-sm font-semibold text-white hover:bg-[#163C41]" href={href}>
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

function AddCredentialActions({
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
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F202A] px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41]"
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

function credentialHref(provider: Provider, companyId?: string) {
  return companyId ? `/dashboard/credentials/company/${companyId}/${provider}` : `/dashboard/credentials/${provider}`
}
