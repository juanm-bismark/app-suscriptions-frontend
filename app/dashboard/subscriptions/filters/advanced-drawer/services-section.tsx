"use client"

import { cn } from "@/lib/utils"
import type { AdvancedFilterSetter, AdvancedSubscriptionFilters } from "../advanced-filters"
import { DrawerGroup, TristateRow } from "./primitives"

export function ServicesFiltersSection({
  filters,
  onFilterChange,
}: {
  filters: AdvancedSubscriptionFilters
  onFilterChange: AdvancedFilterSetter
}) {
  return (
    <DrawerGroup title="SERVICIOS Y SEÑALIZACIÓN">
      <div className="flex flex-col gap-3">
        <TristateRow label="Servicio de datos" value={filters.dataService} onChange={(value) => onFilterChange("dataService", value)} />
        <TristateRow label="Servicio SMS" value={filters.smsService} onChange={(value) => onFilterChange("smsService", value)} />
        <label
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5",
            filters.staleLuOnly ? "bg-table-header-bg" : "bg-transparent"
          )}
        >
          <input
            type="checkbox"
            checked={filters.staleLuOnly}
            onChange={(event) => onFilterChange("staleLuOnly", event.target.checked)}
            className="accent-warning-action"
          />
          <span className="text-[12.5px] font-semibold text-title">Sólo SIMs sin LU reciente (&gt; 30 días)</span>
        </label>
      </div>
    </DrawerGroup>
  )
}

