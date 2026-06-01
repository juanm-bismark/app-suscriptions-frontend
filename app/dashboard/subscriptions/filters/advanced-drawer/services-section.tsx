"use client"

import type { AdvancedFilterSetter, AdvancedSubscriptionFilters } from "../advanced-filters"
import { T } from "../../tokens"
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <TristateRow label="Servicio de datos" value={filters.dataService} onChange={(value) => onFilterChange("dataService", value)} />
        <TristateRow label="Servicio SMS" value={filters.smsService} onChange={(value) => onFilterChange("smsService", value)} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: filters.staleLuOnly ? T.tableHeaderBg : "transparent" }}>
          <input
            type="checkbox"
            checked={filters.staleLuOnly}
            onChange={(event) => onFilterChange("staleLuOnly", event.target.checked)}
            style={{ accentColor: T.warning }}
          />
          <span style={{ fontSize: 12.5, color: T.title, fontWeight: 600 }}>Sólo SIMs sin LU reciente (&gt; 30 días)</span>
        </label>
      </div>
    </DrawerGroup>
  )
}

