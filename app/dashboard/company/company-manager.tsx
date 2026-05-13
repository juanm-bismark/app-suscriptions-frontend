"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Command } from "cmdk"
import { Building2, Loader2, Save, Search, X } from "lucide-react"
import {
  searchCompanies,
  updateCompany,
} from "@/app/actions/company"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectItem } from "@/components/ui/select"
import type { Company } from "@/lib/types/user"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

type CompanyManagerProps = {
  initialCompanies: Company[]
  initialTotal: number | null
  initialPage: number
  initialSize: number
  initialPages: number | null
  initialQuery: string
  initialError?: string | null
}

export default function CompanyManager({
  initialCompanies,
  initialTotal,
  initialPage,
  initialSize,
  initialPages,
  initialQuery,
  initialError,
}: CompanyManagerProps) {
  const [query, setQuery] = useState(initialQuery)
  const [companies, setCompanies] = useState(initialCompanies)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialSize)
  const [pages, setPages] = useState(initialPages)
  const [selected, setSelected] = useState<Company | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [searchError, setSearchError] = useState<string | null>(initialError ?? null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      async function loadCompanies() {
        setIsSearching(true)
        setSearchError(null)

        try {
          const result = await searchCompanies({ q: query, page, size: pageSize })

          if (!active) return

          if (result.success !== true) {
            setSearchError(result.error ?? "No se pudieron cargar las empresas")
            return
          }

          const params = new URLSearchParams({
            page: String(result.page),
            size: String(result.size),
          })
          const cleanQuery = query.trim()
          if (cleanQuery) params.set("q", cleanQuery)
          window.history.replaceState(null, "", `/dashboard/company?${params.toString()}`)

          setCompanies(result.companies)
          const selectedId = selectedIdRef.current
          if (selectedId && !result.companies.some((company) => company.id === selectedId)) {
            clearSelectedCompany()
          }
          setTotal(result.total)
          setPage(result.page)
          setPageSize(result.size)
          setPages(result.pages)
        } finally {
          if (active) setIsSearching(false)
        }
      }

      void loadCompanies()
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, page, pageSize])

  const selectedCreatedAt = useMemo(() => {
    if (!selected) return null
    const date = new Date(selected.created_at)
    if (Number.isNaN(date.getTime())) return "N/A"
    return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date)
  }, [selected])

  function selectCompany(company: Company) {
    selectedIdRef.current = company.id
    setSelected(company)
    setDraftName(company.name)
    setSaveError(null)
    setSuccess(null)
  }

  function clearSelectedCompany() {
    selectedIdRef.current = null
    setSelected(null)
    setDraftName("")
    setSaveError(null)
    setSuccess(null)
  }

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function goToPage(nextPage: number) {
    if (nextPage === page || nextPage < 1) return
    if (pages !== null && nextPage > pages) return
    setPage(nextPage)
  }

  function updatePageSize(nextSize: number) {
    setPageSize(nextSize)
    setPage(1)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return

    setIsSaving(true)
    setSaveError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append("id", selected.id)
    formData.append("name", draftName)

    const result = await updateCompany(formData).finally(() => setIsSaving(false))

    if (result.error) {
      setSaveError(result.error)
      return
    }

    const updated = { ...selected, name: draftName }
    selectedIdRef.current = updated.id
    setSelected(updated)
    setCompanies((items) => items.map((company) => company.id === updated.id ? updated : company))
    setSuccess(result.message || "Empresa actualizada")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)]">
      <section className="rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-title">Empresas en BD</h2>
            <p className="mt-1 text-sm text-muted">
              {total !== null ? `${total} empresas guardadas` : "Busca por nombre o ID"}
            </p>
          </div>
          {isSearching && <Loader2 className="h-5 w-5 animate-spin text-[#326472]" aria-hidden="true" />}
        </div>

        {searchError && (
          <div className="mb-3 rounded-md bg-warn-bg p-3 text-sm text-warn-text">
            {searchError}
          </div>
        )}

        <Command shouldFilter={false} className="space-y-3 overflow-visible bg-transparent">
          <div className="flex h-11 items-center gap-2 rounded-md border border-[#C9DFE3] bg-white px-3 shadow-sm shadow-header-top/5 transition-colors focus-within:border-[#326472] focus-within:ring-2 focus-within:ring-[#BFE5E8]">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <Command.Input
              value={query ?? ""}
              onValueChange={updateQuery}
              placeholder="Buscar empresa..."
              className="h-full w-full bg-transparent text-sm text-title outline-none placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                onClick={() => updateQuery("")}
                title="Limpiar busqueda"
                aria-label="Limpiar busqueda"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-[#EAF6F7] hover:text-title"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <Command.List className="max-h-[420px] overflow-y-auto rounded-lg border border-[#D8E7EA] bg-white p-2 shadow-sm shadow-header-top/5">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
              No se encontraron empresas.
            </Command.Empty>
            {companies.map((company) => (
              <Command.Item
                key={company.id}
                value={company.id}
                onSelect={() => selectCompany(company)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-left outline-none aria-selected:bg-[#E5F5F6] ${selected?.id === company.id ? "bg-[#DDF1F2]" : ""}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-title">{company.name}</span>
                </span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>

        <PaginationControls
          page={page}
          pages={pages}
          size={pageSize}
          total={total}
          isLoading={isSearching}
          onSizeChange={updatePageSize}
          onPrevious={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
        />
      </section>

      <section className="rounded-lg bg-[#DDF1F2] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <h2 className="text-xl font-semibold text-title">Editar empresa</h2>
        {!selected ? (
          <div className="mt-5 rounded-lg bg-white/65 p-6 text-sm text-muted shadow-sm shadow-header-top/5">
            Selecciona una empresa para editar su información.
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <form onSubmit={onSubmit} className="space-y-5">
              {saveError && <div className="rounded-md bg-warn-bg p-3 text-sm text-warn-text">{saveError}</div>}
              {success && <div className="rounded-md bg-[#DDF4EA] p-3 text-sm text-[#16603B]">{success}</div>}

              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Creada</label>
                <div className="min-h-11 rounded-md bg-white/65 px-3 py-2.5 text-sm text-muted shadow-sm shadow-header-top/5">
                  {selectedCreatedAt}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Nombre de la empresa</label>
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Ej. Bismark"
                  className="border-0 bg-white/85 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving || draftName.trim().length < 2}
                loading={isSaving}
                loadingText="Guardando..."
                className="gap-2 bg-[#0F202A] text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41] hover:text-white"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Guardar cambios
              </Button>
            </form>

          </div>
        )}
      </section>
    </div>
  )
}

function PaginationControls({
  page,
  pages,
  size,
  total,
  isLoading,
  onSizeChange,
  onPrevious,
  onNext,
}: {
  page: number
  pages: number | null
  size: number
  total: number | null
  isLoading: boolean
  onSizeChange: (size: number) => void
  onPrevious: () => void
  onNext: () => void
}) {
  const hasPrevious = page > 1
  const hasNext = pages !== null ? page < pages : total === null ? false : page * size < total

  return (
    <div className="mt-5 flex flex-col gap-3 pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>
        Página {page}{pages ? ` de ${pages}` : ""}{total !== null ? ` · ${total} empresas` : ""}
      </span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted">
          Mostrar
          <Select
            value={String(size)}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            className="h-9 w-24 border-[#C9DFE3] bg-white"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </Select>
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!hasPrevious || isLoading}
            loading={isLoading && hasPrevious}
            loadingText="Cargando..."
            onClick={onPrevious}
            className="border-[#94A3B8]/50 bg-[#E8EEF2] text-[#334155] hover:border-[#334155] hover:bg-[#334155] hover:text-white disabled:border-[#CBD5E1]/60 disabled:bg-[#EEF3F5] disabled:text-[#64748B]/60"
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasNext || isLoading}
            loading={isLoading && hasNext}
            loadingText="Cargando..."
            onClick={onNext}
            className="border-[#0E7490]/30 bg-[#D8F0F2] text-[#155E75] hover:border-[#155E75] hover:bg-[#155E75] hover:text-white disabled:border-[#B8DDE1]/70 disabled:bg-[#E3F1F2] disabled:text-[#326472]/55"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
