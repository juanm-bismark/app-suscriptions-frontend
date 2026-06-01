"use client"

import { Building2, Search } from "lucide-react"
import { Alert, AlertDescription, Button } from "@/components/ui"
import type { Provider } from "@/lib/types/api"
import type { Company } from "@/lib/types/user"
import { SourceBadge } from "@/app/dashboard/_components/source-badge"
import { dashboardStyles } from "@/app/dashboard/_components/dashboard-styles"
import { providerName } from "../credential-utils"

export function SelectStep({
  query,
  onQueryChange,
  companies,
  searchError,
  credentialError,
  loadingCompanies,
  loadingMissingProviders,
  selectedCompany,
  missingProviders,
  onSelectCompany,
  selectedProvider,
  onSelectProvider,
  onNext,
}: {
  query: string
  onQueryChange: (q: string) => void
  companies: Company[]
  searchError: string | null
  credentialError: string | null
  loadingCompanies: boolean
  loadingMissingProviders: boolean
  selectedCompany: Company | null
  missingProviders: Provider[] | null
  onSelectCompany: (c: Company) => void
  selectedProvider: Provider | null
  onSelectProvider: (p: Provider) => void
  onNext: () => void
}) {
  const providerOptions = missingProviders ?? []

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-title">Empresa</p>
        <div className={dashboardStyles.searchShell}>
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar empresa..."
            autoFocus
            className="h-full flex-1 bg-transparent text-sm text-title outline-none placeholder:text-muted"
          />
        </div>

        {searchError && (
          <Alert variant="destructive">
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        <div className="max-h-52 overflow-y-auto rounded-md border border-soft-border bg-white shadow-sm shadow-header-top/5">
          {loadingCompanies ? (
            <p className="p-3 text-sm text-muted">Cargando...</p>
          ) : companies.length === 0 ? (
            <p className="p-3 text-sm text-muted">Sin resultados</p>
          ) : (
            companies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => onSelectCompany(company)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedCompany?.id === company.id
                    ? "bg-accent-soft text-title"
                    : "text-muted hover:bg-hover-soft hover:text-title"
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-semibold">{company.name}</span>
                {selectedCompany?.id === company.id && (
                  <span className="ml-auto text-xs font-normal text-header-bg">Seleccionada</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-title">Proveedor</p>
        {selectedCompany ? (
          loadingMissingProviders ? (
            <p className="rounded-md border border-soft-border bg-white p-3 text-sm text-muted shadow-sm shadow-header-top/5">
              Consultando credenciales...
            </p>
          ) : credentialError ? (
            <Alert variant="destructive">
              <AlertDescription>{credentialError}</AlertDescription>
            </Alert>
          ) : providerOptions.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {providerOptions.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => onSelectProvider(provider)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-semibold transition-colors ${
                    selectedProvider === provider
                      ? "border-[#12343B] bg-accent-soft text-title"
                      : "border-soft-border bg-white text-muted hover:border-[#A5CDD3] hover:text-title"
                  }`}
                >
                  <SourceBadge source={provider} size="lg" />
                  <span>{providerName(provider)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-soft-border bg-white p-3 text-sm text-muted shadow-sm shadow-header-top/5">
              Esta empresa ya tiene todas las credenciales configuradas.
            </p>
          )
        ) : (
          <p className="rounded-md border border-soft-border bg-white p-3 text-sm text-muted shadow-sm shadow-header-top/5">
            Selecciona una empresa para ver sus proveedores pendientes.
          </p>
        )}
      </div>

      <Button
        type="button"
        disabled={
          loadingMissingProviders ||
          !selectedCompany ||
          !selectedProvider ||
          !providerOptions.includes(selectedProvider)
        }
        onClick={onNext}
        className={`w-full ${dashboardStyles.primaryAction}`}
      >
        Continuar
      </Button>
    </div>
  )
}
