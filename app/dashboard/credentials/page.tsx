import Link from "next/link"
import { listCompanyCredentials, listCredentials } from "@/app/actions/credentials"
import { searchCompanies } from "@/app/actions/company"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { positiveInt } from "@/lib/utils"
import { ROLES } from "@/lib/types/user"
import { KeyRound, X } from "lucide-react"
import { Alert, AlertDescription, Card } from "@/components/ui"
import { SearchSubmitButton } from "../_components/search-submit-button"
import { WarningAlert } from "../_components/alerts"
import { dashboardStyles } from "../_components/dashboard-styles"
import { DashboardPanel, DashboardSearchShell, DashboardSummaryBadge } from "../_components/dashboard-ui"
import { CompanyPaginationControls } from "./company-pagination-controls"
import { PROVIDERS } from "./credential-utils"
import { AdminAddCredentialDialog } from "./admin-add-credential-dialog"
import { AddCredentialActions, CompanyCredentialLink, CredentialsTable } from "./list"

type CredentialsPageProps = {
  searchParams?: Promise<{ companyId?: string; q?: string; page?: string; size?: string }>
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
      <DashboardPanel className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-title mb-2">Credenciales</h1>
            <p className="text-muted">Administra los accesos de proveedor usados para sincronizar y operar SIMs.</p>
            <AddCredentialActions missingProviders={missingProviders} />
          </div>
          <DashboardSummaryBadge
            icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
            label="Proveedores"
            value={`${activeCredentials}/${PROVIDERS.length} configurados`}
          />
        </div>
      </DashboardPanel>

      {!result.ok && (
        <WarningAlert className="mb-6">
          {result.error}
        </WarningAlert>
      )}

      <Card className={`overflow-hidden border-0 ${dashboardStyles.panelShell}`}>
        <CredentialsTable byProvider={byProvider} />
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
      <DashboardPanel className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-title mb-2">Credenciales</h1>
            <p className="text-muted">Administra credenciales por empresa para toda la plataforma.</p>
            <div className="mt-4">
              <AdminAddCredentialDialog />
            </div>
          </div>
          <DashboardSummaryBadge
            icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
            label="Empresa seleccionada"
            value={selectedCompany?.name ?? selectedId ?? "Sin seleccionar"}
          />
        </div>
      </DashboardPanel>

      {companiesResult.error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{companiesResult.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 min-[480px]:grid-cols-[200px_minmax(0,1fr)] sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <Card className={`border-0 p-4 sm:p-5 md:self-center ${dashboardStyles.panelShell}`}>
          <h2 className="text-xl font-semibold text-title">Empresas</h2>
          <form className="mt-4 flex flex-col gap-2" action="/dashboard/credentials" method="get">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="size" value={pageSize} />
            <DashboardSearchShell>
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
                  className={dashboardStyles.subtleIconButton}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </DashboardSearchShell>
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

        <Card className={`flex min-h-[calc(100vh-22rem)] flex-col overflow-hidden border-0 ${dashboardStyles.panelShell}`}>
          <div className="border-b border-divider-soft/45 p-4 sm:p-5">
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
