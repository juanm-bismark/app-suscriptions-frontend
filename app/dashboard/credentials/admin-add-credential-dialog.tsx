"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Building2, ChevronLeft, Plus, Search } from "lucide-react"
import { searchCompanies } from "@/app/actions/company"
import { listCompanyCredentials } from "@/app/actions/credentials"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui"
import type { Provider } from "@/lib/types/api"
import type { Company } from "@/lib/types/user"
import { SourceBadge } from "@/app/dashboard/subscriptions/primitives"
import { CredentialForm } from "./credential-form"
import { PROVIDERS, providerName } from "./credential-utils"

export function AdminAddCredentialDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"select" | "form">("select")
  const [query, setQuery] = useState("")
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [credentialError, setCredentialError] = useState<string | null>(null)
  const [loadingCompanies, startLoading] = useTransition()
  const [loadingMissingProviders, startLoadingMissingProviders] = useTransition()
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [missingProviders, setMissingProviders] = useState<Provider[] | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const credentialRequestRef = useRef(0)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) return

    setStep("select")
    setQuery("")
    setSelectedCompany(null)
    setSelectedProvider(null)
    setMissingProviders(null)
    setCompanies([])
    setSearchError(null)
    setCredentialError(null)
  }

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(
      () => {
        startLoading(async () => {
          const result = await searchCompanies({ q: query, size: 60 })
          if ("error" in result) {
            setCompanies([])
            setSearchError(result.error ?? "No se pudieron cargar las empresas")
            return
          }

          setCompanies(result.companies ?? [])
          setSearchError(null)
        })
      },
      query ? 280 : 0
    )
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open, query])

  function handleSelectCompany(company: Company) {
    const requestId = credentialRequestRef.current + 1
    credentialRequestRef.current = requestId

    setSelectedCompany(company)
    setSelectedProvider(null)
    setMissingProviders(null)
    setCredentialError(null)

    startLoadingMissingProviders(async () => {
      const result = await listCompanyCredentials(company.id)
      if (credentialRequestRef.current !== requestId) return

      if (!result.ok) {
        setMissingProviders([])
        setCredentialError(result.error)
        return
      }

      const missing = PROVIDERS.filter(
        (provider) => !result.data.some((credential) => credential.active && credential.provider === provider)
      )

      setMissingProviders(missing)
      setCredentialError(null)

      if (missing.length === 1) {
        setSelectedProvider(missing[0])
        setStep("form")
      }
    })
  }

  function goToForm() {
    if (selectedCompany && selectedProvider && missingProviders?.includes(selectedProvider)) {
      setStep("form")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center gap-2 rounded-md bg-[#0F202A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#163C41]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar credencial
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-[#F5FAFA] p-0">
        <DialogHeader className="shrink-0 border-b border-[#D8E7EA] px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-title">
            {step === "select"
              ? "Agregar credencial"
              : `${providerName(selectedProvider!)} · ${selectedCompany?.name}`}
          </DialogTitle>
          {step === "form" && (
            <button
              type="button"
              onClick={() => setStep("select")}
              className="mt-1 inline-flex items-center gap-1 text-sm text-header-bg hover:underline"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Cambiar empresa o proveedor
            </button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "select" ? (
            <SelectStep
              query={query}
              onQueryChange={setQuery}
              companies={companies}
              searchError={searchError}
              credentialError={credentialError}
              loadingCompanies={loadingCompanies}
              loadingMissingProviders={loadingMissingProviders}
              selectedCompany={selectedCompany}
              missingProviders={missingProviders}
              onSelectCompany={handleSelectCompany}
              selectedProvider={selectedProvider}
              onSelectProvider={setSelectedProvider}
              onNext={goToForm}
            />
          ) : (
            <div className="rounded-lg bg-[#DDF1F2] p-5 sm:p-6">
              <CredentialForm
                provider={selectedProvider!}
                credential={null}
                isAdmin
                companyId={selectedCompany!.id}
                onSuccess={() => handleOpenChange(false)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SelectStep({
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
        <div className="flex h-9 items-center rounded-md border border-[#C9DFE3] bg-white px-2.5 shadow-sm shadow-header-top/5 focus-within:ring-2 focus-within:ring-header-accent">
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

        <div className="max-h-52 overflow-y-auto rounded-md border border-[#C9DFE3] bg-white shadow-sm shadow-header-top/5">
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
                    ? "bg-[#DDF1F2] text-title"
                    : "text-muted hover:bg-[#EAF6F7] hover:text-title"
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
            <p className="rounded-md border border-[#C9DFE3] bg-white p-3 text-sm text-muted shadow-sm shadow-header-top/5">
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
                      ? "border-[#12343B] bg-[#DDF1F2] text-title"
                      : "border-[#C9DFE3] bg-white text-muted hover:border-[#A5CDD3] hover:text-title"
                  }`}
                >
                  <SourceBadge source={provider} size="lg" />
                  <span>{providerName(provider)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-[#C9DFE3] bg-white p-3 text-sm text-muted shadow-sm shadow-header-top/5">
              Esta empresa ya tiene todas las credenciales configuradas.
            </p>
          )
        ) : (
          <p className="rounded-md border border-[#C9DFE3] bg-white p-3 text-sm text-muted shadow-sm shadow-header-top/5">
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
        className="w-full border-0 bg-[#0F202A] text-white shadow-sm hover:bg-[#163C41] disabled:opacity-40"
      >
        Continuar
      </Button>
    </div>
  )
}
