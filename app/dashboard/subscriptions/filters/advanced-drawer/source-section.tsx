"use client"

import { cn } from "@/lib/utils"
import { canSelectAllSources, sourceConicGradient } from "../source-filter"
import { SOURCES, type SourceId } from "../../tokens"
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
        <label
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5",
            allSourcesSelected ? "bg-table-header-bg" : "bg-transparent"
          )}
        >
          <input type="checkbox" checked={allSourcesSelected} onChange={() => onFilterChange("sourceIds", null)} className="accent-header-bg" />
          <span className="h-2 w-2 rounded-full" style={{ backgroundImage: conicGradient }} />
          <span className="flex-1 text-[12.5px] font-bold text-title">Todas</span>
          <span className="font-mono text-[11px] text-muted">{totalRows}</span>
        </label>
      )}
      {activeProviderIds.map((provider) => {
        const source = SOURCES[provider]
        const checked = selectedSourceIds.has(provider)
        return (
          <label
            key={source.id}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5"
            style={{ background: checked ? source.tintBg : "transparent" }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleSource(provider)}
              style={{ accentColor: source.color }}
            />
            <span className="h-2 w-2 rounded-full" style={{ background: source.color }} />
            <span className="flex-1 text-[12.5px] font-semibold text-title">{source.name}</span>
            <span className="font-mono text-[11px] text-muted">{providerCounts[provider] ?? 0}</span>
          </label>
        )
      })}
    </DrawerGroup>
  )
}
