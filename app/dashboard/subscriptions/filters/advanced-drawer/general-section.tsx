"use client"

import type { AdvancedFilterSetter, AdvancedSubscriptionFilters } from "../advanced-filters"
import { DrawerGroup, TextFilterInput } from "./primitives"

export function GeneralFiltersSection({
  filters,
  onFilterChange,
}: {
  filters: AdvancedSubscriptionFilters
  onFilterChange: AdvancedFilterSetter
}) {
  return (
    <DrawerGroup title="GENERALES">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <TextFilterInput label="Plan" value={filters.plan} onChange={(value) => onFilterChange("plan", value)} placeholder="Nombre o código..." />
        <TextFilterInput label="Cliente" value={filters.client} onChange={(value) => onFilterChange("client", value)} placeholder="Nombre o scope..." />
        <TextFilterInput label="IMEI" value={filters.imei} onChange={(value) => onFilterChange("imei", value)} placeholder="359000000000001" />
        <TextFilterInput label="Operador celular" value={filters.operator} onChange={(value) => onFilterChange("operator", value)} placeholder="Claro, AT&T, Telefonica..." />
      </div>
    </DrawerGroup>
  )
}

