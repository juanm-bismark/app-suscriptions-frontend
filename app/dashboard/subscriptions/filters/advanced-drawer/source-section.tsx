"use client"

import { canSelectAllSources, sourceConicGradient } from "../source-filter"
import { SOURCES, type SourceId, T } from "../../tokens"
import type { AdvancedFilterSetter, AdvancedSubscriptionFilters } from "../advanced-filters"
import { DrawerGroup } from "./primitives"

export function SourceFilterSection({
  activeProviderIds,
  filters,
  providerCounts,
  totalRows,
  onFilterChange,
}: {
  activeProviderIds: SourceId[]
  filters: AdvancedSubscriptionFilters
  providerCounts: Partial<Record<SourceId, number>>
  totalRows: number
  onFilterChange: AdvancedFilterSetter
}) {
  const conicGradient = sourceConicGradient(activeProviderIds)
  const selectedSourceIds = filters.sourceIds ?? new Set(activeProviderIds)
  const allSourcesSelected = !filters.sourceIds || filters.sourceIds.size === activeProviderIds.length

  function toggleSource(source: SourceId) {
    const next = new Set(filters.sourceIds ?? activeProviderIds)
    if (next.has(source)) next.delete(source)
    else next.add(source)
    onFilterChange("sourceIds", next.size === 0 || next.size === activeProviderIds.length ? null : next)
  }

  return (
    <DrawerGroup title="FUENTES">
      {canSelectAllSources(activeProviderIds) && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: allSourcesSelected ? T.tableHeaderBg : "transparent" }}>
          <input type="checkbox" checked={allSourcesSelected} onChange={() => onFilterChange("sourceIds", null)} style={{ accentColor: T.headerBg }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundImage: conicGradient }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.title, flex: 1 }}>Todas</span>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{totalRows}</span>
        </label>
      )}
      {activeProviderIds.map((provider) => {
        const source = SOURCES[provider]
        const checked = selectedSourceIds.has(provider)
        return (
          <label key={source.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: checked ? source.tintBg : "transparent" }}>
            <input type="checkbox" checked={checked} onChange={() => toggleSource(provider)} style={{ accentColor: source.color }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: source.color }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.title, flex: 1 }}>{source.name}</span>
            <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{providerCounts[provider] ?? 0}</span>
          </label>
        )
      })}
    </DrawerGroup>
  )
}

