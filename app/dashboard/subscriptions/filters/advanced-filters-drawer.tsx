"use client"

import { useEffect } from "react"
import { Btn, Icon } from "../primitives"
import { T, type SourceId } from "../tokens"
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
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,30,40,.28)", zIndex: 60 }} />
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(320px, 92vw)",
          background: T.cardBg,
          borderRight: `1px solid ${T.border}`,
          boxShadow: "12px 0 32px rgba(20,40,50,.10)",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
          fontFamily: T.fontBody,
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, background: T.tableHeaderBg }}>
          <Icon.filter size={14} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.title, letterSpacing: -0.1 }}>Filtros avanzados</div>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} title="Cerrar" style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", padding: 4, lineHeight: 0, borderRadius: 4 }}>
            <Icon.close size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
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

        <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, background: T.cardBg }}>
          <Btn variant="ghost" size="sm" onClick={onReset}>
            Limpiar
          </Btn>
          <div style={{ flex: 1 }} />
          <Btn variant="primary" size="sm" onClick={onClose}>
            Aplicar · {rowsCount}
          </Btn>
        </div>
      </aside>
    </>
  )
}

