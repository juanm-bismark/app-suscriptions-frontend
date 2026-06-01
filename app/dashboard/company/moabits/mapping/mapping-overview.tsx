"use client"

import Link from "next/link"
import { AlertTriangle, Plus, RefreshCw, Search, X } from "lucide-react"
import type { LocalCompanyMoabitsMappingOut } from "@/lib/types/api"
import { SearchSubmitButton } from "@/app/dashboard/_components/search-submit-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@/components/ui"
import { MoabitsPaginationControls } from "../moabits-pagination-controls"
import type { MappingPageInfo, MoabitsOption } from "./types"
import { MappingTable } from "./mapping-table"
import { Metric } from "./primitives"

export function MappingOverview({
  linkedRows,
  linkedCount,
  allMappingsCount,
  moabitsCompanyCount,
  moabitsCompanyLabel,
  pageInfo,
  pageSize,
  query,
  moabitsOptions,
  loadingDb,
  loadingDiscovery,
  confirmingId,
  deletingId,
  onRefreshDb,
  onRefreshDiscovery,
  onStartCreate,
  onEdit,
  onConfirmRemove,
  onCancelRemove,
  onRemove,
}: {
  linkedRows: LocalCompanyMoabitsMappingOut[]
  linkedCount: number
  allMappingsCount: number
  moabitsCompanyCount: number
  moabitsCompanyLabel: string
  pageInfo: MappingPageInfo
  pageSize: number
  query: string
  moabitsOptions: MoabitsOption[]
  loadingDb: boolean
  loadingDiscovery: boolean
  confirmingId: string | null
  deletingId: string | null
  onRefreshDb: () => void
  onRefreshDiscovery: () => void
  onStartCreate: () => void
  onEdit: (row: LocalCompanyMoabitsMappingOut) => void
  onConfirmRemove: (companyId: string) => void
  onCancelRemove: () => void
  onRemove: (companyId: string) => void
}) {
  const clearSearchHref = `/dashboard/company/moabits?page=1&size=${pageSize}`

  return (
    <section className="rounded-lg bg-panel-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-title">Vinculaciones actuales</h2>
          <p className="mt-1 text-sm text-muted">
            {linkedCount} vinculacion{linkedCount !== 1 ? "es" : ""} guardada{linkedCount !== 1 ? "s" : ""} en BD.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={onRefreshDb}
            loading={loadingDb}
            loadingText="Consultando cache..."
            className="gap-2 border-0 bg-white/80 text-action-soft shadow-sm shadow-header-top/5 hover:bg-white hover:text-ink-teal"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Consultar cache desde BD
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={loadingDiscovery}
                loading={loadingDiscovery}
                loadingText="Consultando..."
                className="gap-2 border-0 bg-white/80 text-action-soft shadow-sm shadow-header-top/5 hover:bg-white hover:text-ink-teal"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Consultar Moabits
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="gap-5">
              <AlertDialogHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning-soft text-warning-icon-soft">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <AlertDialogTitle>Consultar Moabits</AlertDialogTitle>
                    <AlertDialogDescription className="mt-1">
                      Al continuar, el backend consultara Moabits y sobreescribira la tabla cache que se usa para
                      linkear companias.
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>
              <div className="rounded-md border border-warning-border-soft bg-warning-soft px-3 py-2 text-sm font-medium text-warning-text-soft">
                Si en Moabits hubo actualizaciones de codigos para cada compania, esta consulta puede generar
                informacion incongruente entre companias hasta que se revisen las vinculaciones.
              </div>
              <AlertDialogFooter className="pt-1">
                <AlertDialogCancel disabled={loadingDiscovery}>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={loadingDiscovery} onClick={onRefreshDiscovery}>
                  Confirmar consulta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="button"
            onClick={onStartCreate}
            className="gap-2 bg-header-top text-white shadow-sm shadow-header-top/20 hover:bg-header-bg hover:text-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva vinculacion
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="BD: empresas locales" value={String(allMappingsCount)} />
        <Metric label="BD: vinculos guardados" value={String(linkedCount)} />
        <Metric label={moabitsCompanyLabel} value={String(moabitsCompanyCount)} />
      </div>

      <form
        className="mt-4 flex gap-2"
        action="/dashboard/company/moabits"
        method="get"
      >
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="size" value={pageSize} />
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md bg-white/80 px-3 shadow-sm shadow-header-top/5 focus-within:ring-2 focus-within:ring-header-accent">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por empresa, código Moabits o nombre..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-title outline-none placeholder:text-muted"
          />
          {query && (
            <Link
              href={clearSearchHref}
              title="Limpiar busqueda"
              aria-label="Limpiar busqueda"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-hover-soft hover:text-title"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        <SearchSubmitButton loadingText="Buscando...">
          Buscar
        </SearchSubmitButton>
      </form>

      <MappingTable
        rows={linkedRows}
        query={query}
        moabitsOptions={moabitsOptions}
        confirmingId={confirmingId}
        deletingId={deletingId}
        onEdit={onEdit}
        onConfirmRemove={onConfirmRemove}
        onCancelRemove={onCancelRemove}
        onRemove={onRemove}
      />

      <MoabitsPaginationControls
        page={pageInfo.page}
        pages={pageInfo.pages}
        size={pageInfo.size}
        total={pageInfo.total}
        query={query}
      />
    </section>
  )
}
