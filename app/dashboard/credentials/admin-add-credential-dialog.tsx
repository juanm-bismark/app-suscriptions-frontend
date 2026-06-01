"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { ChevronLeft, Plus } from "lucide-react"
import { searchCompanies } from "@/app/actions/company"
import { listCompanyCredentials } from "@/app/actions/credentials"
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui"
import type { Provider } from "@/lib/types/api"
import type { Company } from "@/lib/types/user"
import { dashboardStyles } from "../_components/dashboard-styles"
import { CredentialForm } from "./credential-form"
import { SelectStep } from "./admin-dialog"
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
        <Button className={dashboardStyles.primaryAction}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar credencial
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-panel-soft p-0">
        <DialogHeader className="shrink-0 border-b border-divider-soft px-6 py-5">
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
            <div className={dashboardStyles.accentPanel}>
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
