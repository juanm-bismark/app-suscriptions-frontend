"use client"

import type {
  AdvancedArrayFilterKey,
  AdvancedFilterSetter,
  AdvancedSubscriptionFilters,
} from "../advanced-filters"
import type { SourceId } from "../../tokens"
import { DrawerGroup, IndexedTextFilters, TextFilterInput, TristateRow } from "./primitives"

export function ProviderSpecificFilters({
  activeSrc,
  filters,
  onFilterChange,
  onArrayFilterValueChange,
}: {
  activeSrc: SourceId
  filters: AdvancedSubscriptionFilters
  onFilterChange: AdvancedFilterSetter
  onArrayFilterValueChange: (key: AdvancedArrayFilterKey, index: number, value: string) => void
}) {
  if (activeSrc === "kite") {
    return (
      <DrawerGroup title="ESPECÍFICOS DEL PROVEEDOR">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TextFilterInput label="Alias" value={filters.kiteAlias} onChange={(value) => onFilterChange("kiteAlias", value)} placeholder="Nombre de SIM..." />
          <TextFilterInput label="Commercial group" value={filters.kiteCommercialGroup} onChange={(value) => onFilterChange("kiteCommercialGroup", value)} placeholder="Grupo comercial..." />
          <TextFilterInput label="Supervision group" value={filters.kiteSupervisionGroup} onChange={(value) => onFilterChange("kiteSupervisionGroup", value)} placeholder="Grupo de supervisión..." />
          <TextFilterInput label="Service pack" value={filters.kiteServicePack} onChange={(value) => onFilterChange("kiteServicePack", value)} placeholder="Pack de servicio..." />
          <IndexedTextFilters labelPrefix="Custom field" values={filters.kiteCustomFields} onChange={(index, value) => onArrayFilterValueChange("kiteCustomFields", index, value)} />
        </div>
      </DrawerGroup>
    )
  }
  if (activeSrc === "tele2") {
    return (
      <DrawerGroup title="ESPECÍFICOS DEL PROVEEDOR">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TextFilterInput label="Rate plan" value={filters.tele2RatePlan} onChange={(value) => onFilterChange("tele2RatePlan", value)} placeholder="PAYU, pooled..." />
          <TextFilterInput label="Communication plan" value={filters.tele2CommunicationPlan} onChange={(value) => onFilterChange("tele2CommunicationPlan", value)} placeholder="Data LTE SMS..." />
          <TextFilterInput label="Account ID" value={filters.tele2AccountId} onChange={(value) => onFilterChange("tele2AccountId", value)} placeholder="100020620" />
          <IndexedTextFilters labelPrefix="Account custom" values={filters.tele2AccountCustoms} onChange={(index, value) => onArrayFilterValueChange("tele2AccountCustoms", index, value)} />
          <IndexedTextFilters labelPrefix="Operator custom" values={filters.tele2OperatorCustoms} onChange={(index, value) => onArrayFilterValueChange("tele2OperatorCustoms", index, value)} />
          <IndexedTextFilters labelPrefix="Customer custom" values={filters.tele2CustomerCustoms} onChange={(index, value) => onArrayFilterValueChange("tele2CustomerCustoms", index, value)} />
        </div>
      </DrawerGroup>
    )
  }
  return (
    <DrawerGroup title="ESPECÍFICOS DEL PROVEEDOR">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <TextFilterInput label="Plan asociado" value={filters.moabitsProductName} onChange={(value) => onFilterChange("moabitsProductName", value)} placeholder="15MB Fixed Plan..." />
        <TextFilterInput label="Código de producto" value={filters.moabitsProductCode} onChange={(value) => onFilterChange("moabitsProductCode", value)} placeholder="FP15M-Z5-01" />
        <TextFilterInput label="Company code" value={filters.moabitsCompanyCode} onChange={(value) => onFilterChange("moabitsCompanyCode", value)} placeholder="48123" />
        <TristateRow label="Auto-renovación" value={filters.moabitsAutorenewal} onChange={(value) => onFilterChange("moabitsAutorenewal", value)} />
        <TextFilterInput label="Límite datos MB" value={filters.moabitsDataLimitMb} onChange={(value) => onFilterChange("moabitsDataLimitMb", value)} placeholder="1500" />
        <TextFilterInput label="Límite SMS" value={filters.moabitsSmsLimit} onChange={(value) => onFilterChange("moabitsSmsLimit", value)} placeholder="100" />
        <TextFilterInput label="País" value={filters.moabitsCountry} onChange={(value) => onFilterChange("moabitsCountry", value)} placeholder="Colombia" />
        <TextFilterInput label="RAT" value={filters.moabitsRatType} onChange={(value) => onFilterChange("moabitsRatType", value)} placeholder="4G, LTE..." />
      </div>
    </DrawerGroup>
  )
}

