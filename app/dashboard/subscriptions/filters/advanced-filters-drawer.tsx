"use client"

import { useEffect } from "react"
import { Btn, Icon } from "../primitives"
import type { SourceId } from "../tokens"
import type {
  AdvancedArrayFilterKey,
  AdvancedFilterSetter,
  AdvancedSubscriptionFilters,
} from "./advanced-filters"
import type { SourceFilter } from "./source-filter"
import { GeneralFiltersSection } from "./advanced-drawer/general-section"
import { ProviderSpecificFilters } from "./advanced-drawer/provider-specific-section"
import { ServicesFiltersSection } from "./advanced-drawer/services-section"
import { SourceFilterSection } from "./advanced-drawer/source-section"
import { Divider } from "./advanced-drawer/primitives"

export function AdvancedFiltersDrawer({
  open,
  filters,
  activeSrc,
  activeProviderIds,
  providerCounts,
  totalRows,
  rowsCount,
  isAdmin,
  onClose,
  onReset,
  onFilterChange,
  onArrayFilterValueChange,
}: {
  open: boolean
  filters: AdvancedSubscriptionFilters
  activeSrc: SourceFilter
  activeProviderIds: SourceId[]
  providerCounts: Partial<Record<SourceId, number>>
  totalRows: number
  rowsCount: number
  isAdmin: boolean
  onClose: () => void
  onReset: () => void
  onFilterChange: AdvancedFilterSetter
  onArrayFilterValueChange: (key: AdvancedArrayFilterKey, index: number, value: string) => void
}) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-[rgba(15,30,40,.28)]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filtros avanzados"
        className="fixed inset-y-0 left-0 z-[61] flex w-[min(320px,92vw)] flex-col border-r border-border bg-card font-body shadow-[12px_0_32px_rgba(20,40,50,.10)]"
      >
        <div className="flex items-center gap-2.5 border-b border-border bg-table-header-bg px-[18px] py-3.5">
          <Icon.filter size={14} />
          <div className="text-[13px] font-bold tracking-[-0.1px] text-title">Filtros avanzados</div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            title="Cerrar"
            className="rounded p-1 leading-none text-muted transition-colors hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
          >
            <Icon.close size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-[18px] py-4">
          <SourceFilterSection
            activeProviderIds={activeProviderIds}
            filters={filters}
            providerCounts={providerCounts}
            totalRows={totalRows}
            onFilterChange={onFilterChange}
          />

          <Divider />
          <GeneralFiltersSection filters={filters} onFilterChange={onFilterChange} />

          <Divider />
          <ServicesFiltersSection filters={filters} onFilterChange={onFilterChange} />

          {isAdmin && activeSrc !== "all" && (
            <>
              <Divider />
              <ProviderSpecificFilters
                activeSrc={activeSrc}
                filters={filters}
                onFilterChange={onFilterChange}
                onArrayFilterValueChange={onArrayFilterValueChange}
              />
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-border bg-card p-3">
          <Btn variant="ghost" size="sm" onClick={onReset}>
            Limpiar
          </Btn>
          <div className="flex-1" />
          <Btn variant="primary" size="sm" onClick={onClose}>
            Aplicar · {rowsCount}
          </Btn>
        </div>
      </aside>
    </>
  )
}
