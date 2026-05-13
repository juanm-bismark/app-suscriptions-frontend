"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Command } from "cmdk"
import { Building2, Loader2, Plus, Save, Search, Trash2, X } from "lucide-react"
import {
  createCompany,
  deleteCompany,
  searchCompanies,
  updateCompany,
} from "@/app/actions/company"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(initialError ?? null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

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
  }, [query, page, pageSize, reloadToken])

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
    setIsCreatingNew(false)
    setDeleteTarget(null)
    setSaveError(null)
    setSuccess(null)
  }

  function clearSelectedCompany() {
    selectedIdRef.current = null
    setSelected(null)
    setDraftName("")
    setIsCreatingNew(false)
    setDeleteTarget(null)
    setSaveError(null)
    setSuccess(null)
  }

  function startCreateCompany() {
    selectedIdRef.current = null
    setSelected(null)
    setDraftName("")
    setIsCreatingNew(true)
    setDeleteTarget(null)
    setSaveError(null)
    setSuccess(null)
  }

  function requestDeleteCompany(company: Company) {
    setDeleteTarget(company)
    setSaveError(null)
    setSuccess(null)
  }

  function updateDeleteDialogOpen(open: boolean) {
    if (!open && !isDeleting) {
      setDeleteTarget(null)
    }
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
    if (!isCreatingNew && !selected) return

    setIsSaving(true)
    setSaveError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append("name", draftName)

    if (isCreatingNew) {
      const result = await createCompany(formData).finally(() => setIsSaving(false))

      if (result.success !== true) {
        setSaveError(result.error ?? "No se pudo crear la empresa")
        return
      }

      selectedIdRef.current = result.company.id
      setSelected(result.company)
      setDraftName(result.company.name)
      setIsCreatingNew(false)
      setQuery("")
      setPage(1)
      setReloadToken((value) => value + 1)
      setSuccess(result.message || "Empresa creada")
      return
    }

    if (!selected) {
      setIsSaving(false)
      return
    }

    formData.append("id", selected.id)
    const result = await updateCompany(formData).finally(() => setIsSaving(false))

    if (result.success !== true) {
      setSaveError(result.error ?? "No se pudo actualizar la empresa")
      return
    }

    const updated = result.company
    selectedIdRef.current = updated.id
    setSelected(updated)
    setCompanies((items) => items.map((company) => company.id === updated.id ? updated : company))
    setSuccess(result.message || "Empresa actualizada")
  }

  async function onDeleteTarget() {
    if (!deleteTarget) return

    setIsDeleting(true)
    setSaveError(null)
    setSuccess(null)

    const companyToDelete = deleteTarget
    const deletedId = companyToDelete.id
    const isLastCompanyOnPage = companies.length === 1
    const formData = new FormData()
    formData.append("id", deletedId)

    const result = await deleteCompany(formData).finally(() => setIsDeleting(false))

    if (result.success !== true) {
      setDeleteTarget(null)
      setSaveError(result.error ?? "No se pudo eliminar la empresa")
      return
    }

    setDeleteTarget(null)
    if (selectedIdRef.current === deletedId) {
      selectedIdRef.current = null
      setSelected(null)
      setDraftName("")
      setIsCreatingNew(false)
    }
    setCompanies((items) => items.filter((company) => company.id !== deletedId))
    setTotal((current) => current === null ? current : Math.max(0, current - 1))
    if (isLastCompanyOnPage && page > 1) {
      setPage(page - 1)
    } else {
      setReloadToken((value) => value + 1)
    }
    setSuccess(result.message || "Empresa eliminada")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)]">
      <section className="rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-title">Empresas en BD</h2>
            <p className="mt-1 text-sm text-muted">
              {total !== null ? `${total} empresas guardadas` : "Busca por nombre o ID"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSearching && <Loader2 className="h-5 w-5 animate-spin text-[#326472]" aria-hidden="true" />}
            <Button
              type="button"
              onClick={startCreateCompany}
              className="gap-2 bg-[#0E7490] text-white shadow-sm shadow-[#0E7490]/20 hover:bg-[#0F4C5C] hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Añadir empresa
            </Button>
          </div>
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Eliminar empresa"
                  aria-label={`Eliminar empresa ${company.name}`}
                  disabled={isDeleting}
                  loading={isDeleting && deleteTarget?.id === company.id}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    requestDeleteCompany(company)
                  }}
                  className="h-8 w-8 shrink-0 border-[#DC2626]/25 bg-white text-[#B91C1C] shadow-sm shadow-[#DC2626]/10 hover:border-[#B91C1C] hover:bg-[#FEE2E2] hover:text-[#7F1D1D]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-title">
              {isCreatingNew ? "Añadir empresa" : "Editar empresa"}
            </h2>
            {selected && !isCreatingNew && (
              <p className="mt-1 break-all font-mono text-xs text-muted">{selected.id}</p>
            )}
          </div>
          {selected && !isCreatingNew && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Eliminar empresa"
              aria-label={`Eliminar empresa ${selected.name}`}
              disabled={isDeleting}
              loading={isDeleting && deleteTarget?.id === selected.id}
              onClick={() => requestDeleteCompany(selected)}
              className="h-9 w-9 border-[#DC2626]/25 bg-white text-[#B91C1C] shadow-sm shadow-[#DC2626]/10 hover:border-[#B91C1C] hover:bg-[#FEE2E2] hover:text-[#7F1D1D]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {saveError && <div className="mt-5 rounded-md bg-warn-bg p-3 text-sm text-warn-text">{saveError}</div>}
        {success && <div className="mt-5 rounded-md bg-[#DDF4EA] p-3 text-sm text-[#16603B]">{success}</div>}

        {!selected && !isCreatingNew ? (
          <div className="mt-5 rounded-lg bg-white/65 p-6 text-sm text-muted shadow-sm shadow-header-top/5">
            Selecciona una empresa para editarla o usa el botón para añadir una nueva.
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <form onSubmit={onSubmit} className="space-y-5">
              {selected && !isCreatingNew && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted">Creada</label>
                  <div className="min-h-11 rounded-md bg-white/65 px-3 py-2.5 text-sm text-muted shadow-sm shadow-header-top/5">
                    {selectedCreatedAt}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Nombre de la empresa</label>
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Ej. Acme"
                  className="border-0 bg-white/85 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  disabled={isSaving || isDeleting || draftName.trim().length < 2}
                  loading={isSaving}
                  loadingText={isCreatingNew ? "Añadiendo..." : "Guardando..."}
                  className="gap-2 bg-[#0F202A] text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41] hover:text-white"
                >
                  {isCreatingNew ? (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isCreatingNew ? "Añadir empresa" : "Guardar cambios"}
                </Button>
                {isCreatingNew && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={clearSelectedCompany}
                    className="border-[#94A3B8]/50 bg-white text-[#334155] hover:border-[#334155] hover:bg-[#334155] hover:text-white"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>

          </div>
        )}
      </section>
      {deleteTarget && (
        <DeleteCompanyDialog
          company={deleteTarget}
          deleting={isDeleting}
          open={Boolean(deleteTarget)}
          onOpenChange={updateDeleteDialogOpen}
          onConfirm={onDeleteTarget}
        />
      )}
    </div>
  )
}

function DeleteCompanyDialog({
  company,
  deleting,
  open,
  onOpenChange,
  onConfirm,
}: {
  company: Company
  deleting: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar empresa</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará {company.name}. No se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            loading={deleting}
            loadingText="Eliminando..."
            onClick={onConfirm}
            className="border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#B91C1C] hover:text-white"
          >
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
