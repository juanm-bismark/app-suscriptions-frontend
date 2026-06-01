"use client"

import { Command } from "cmdk"
import { Building2, Loader2, Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dashboardStyles } from "../../_components/dashboard-styles"
import type { Company } from "@/lib/types/user"
import { PaginationControls } from "./pagination-controls"

export function CompanyList({
  companies,
  total,
  query,
  selected,
  searchError,
  isSearching,
  isDeleting,
  deleteTarget,
  page,
  pages,
  pageSize,
  onQueryChange,
  onSelectCompany,
  onStartCreate,
  onRequestDelete,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: {
  companies: Company[]
  total: number | null
  query: string
  selected: Company | null
  searchError: string | null
  isSearching: boolean
  isDeleting: boolean
  deleteTarget: Company | null
  page: number
  pages: number | null
  pageSize: number
  onQueryChange: (value: string) => void
  onSelectCompany: (company: Company) => void
  onStartCreate: () => void
  onRequestDelete: (company: Company) => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
}) {
  return (
    <section className={`flex flex-col ${dashboardStyles.panel}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-title">Empresas en BD</h2>
          <p className="mt-1 text-sm text-muted">
            {total !== null ? `${total} empresas guardadas` : "Busca por nombre o ID"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSearching && <Loader2 className="h-5 w-5 animate-spin text-table-header-text" aria-hidden="true" />}
          <Button
            type="button"
            onClick={onStartCreate}
            className={dashboardStyles.primaryAction}
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
        <div className={dashboardStyles.commandSearchShell}>
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <Command.Input
            value={query ?? ""}
            onValueChange={onQueryChange}
            placeholder="Buscar empresa..."
            className="h-full w-full bg-transparent text-sm text-title outline-none placeholder:text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              title="Limpiar busqueda"
              aria-label="Limpiar busqueda"
              className={dashboardStyles.subtleIconButton}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <Command.List className="max-h-[420px] overflow-y-auto rounded-lg border border-divider-soft bg-white p-2 shadow-sm shadow-header-top/5">
          <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
            No se encontraron empresas.
          </Command.Empty>
          {companies.map((company) => (
            <Command.Item
              key={company.id}
              value={company.id}
              onSelect={() => onSelectCompany(company)}
              className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-left outline-none aria-selected:bg-provider-kite-soft ${selected?.id === company.id ? "bg-accent-soft" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-ink-teal">
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
                  onRequestDelete(company)
                }}
                className={dashboardStyles.dangerSmallIconButton}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Command.Item>
          ))}
        </Command.List>
      </Command>

      <div className="mt-auto">
        <PaginationControls
          page={page}
          pages={pages}
          size={pageSize}
          total={total}
          isLoading={isSearching}
          onSizeChange={onPageSizeChange}
          onPrevious={onPreviousPage}
          onNext={onNextPage}
        />
      </div>
    </section>
  )
}
