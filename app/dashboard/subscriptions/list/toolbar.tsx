"use client"

import { isExactIccidQuery, type SearchMode } from "@/lib/sim-identifiers"
import { Btn, Icon } from "../primitives"
import { SourceFilterTabs, type SourceFilter } from "../filters/source-filter"
import { StatusFilterControls } from "../filters/status-filter-controls"
import type { NativeStatusSelections } from "../filters/status-filter"
import { KpiStrip } from "./kpi-strip"
import type { StatusFilter, ViewScope } from "./types"
import type { SourceId } from "../tokens"
import { SOURCES, T } from "../tokens"
import type { AdvancedSubscriptionFilters } from "../filters/advanced-filters"
import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { AdvancedFiltersButton } from "./toolbar/advanced-filters-button"
import { SearchBox } from "./toolbar/search-box"
import { SearchModeControl } from "./toolbar/search-mode-control"
import { ViewScopeSwitch } from "./toolbar/view-scope-switch"

export function SubscriptionsToolbar({
  isAdmin,
  hasCompanyScope,
  viewScope,
  onSwitchViewScope,
  onRefreshData,
  activeSearchMode,
  setActiveSearchMode,
  draftQ,
  setDraftQ,
  commitSearch,
  clearSearch,
  q,
  activeSrc,
  activeProviderIds,
  onSourceChange,
  isMultiIccid,
  iccidList,
  rows,
  advancedFilterValues,
  activeStatus,
  statusSelections,
  statusCount,
  statusFilterCount,
  onActiveStatusChange,
  onClearStatusSelections,
  onToggleStatusSelection,
  advancedCount,
  onOpenAdvancedFilters,
}: {
  isAdmin: boolean
  hasCompanyScope: boolean
  viewScope: ViewScope
  onSwitchViewScope: (scope: ViewScope) => void
  onRefreshData: () => void
  activeSearchMode: SearchMode
  setActiveSearchMode: (mode: SearchMode) => void
  draftQ: string
  setDraftQ: (query: string) => void
  commitSearch: () => void
  clearSearch: () => void
  q: string
  activeSrc: SourceFilter
  activeProviderIds: SourceId[]
  onSourceChange: (source: SourceFilter) => void
  isMultiIccid: boolean
  iccidList: string[]
  rows: SubscriptionRow[]
  advancedFilterValues: AdvancedSubscriptionFilters
  activeStatus: StatusFilter
  statusSelections: NativeStatusSelections
  statusCount: (provider: SourceId, status: string) => number
  statusFilterCount: number
  onActiveStatusChange: (status: StatusFilter) => void
  onClearStatusSelections: () => void
  onToggleStatusSelection: (provider: SourceId, status: string) => void
  advancedCount: number
  onOpenAdvancedFilters: () => void
}) {
  return (
    <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.2,
              color: T.muted,
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Búsqueda unificada
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: -0.4 }}>
            Suscripciones
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {isAdmin && (
            <ViewScopeSwitch
              viewScope={viewScope}
              hasCompanyScope={hasCompanyScope}
              onSwitchViewScope={onSwitchViewScope}
            />
          )}
          <Btn variant="outline" size="sm" icon={<Icon.refresh size={13} />} onClick={onRefreshData}>
            Actualizar tabla
          </Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <SearchModeControl activeSearchMode={activeSearchMode} onChange={setActiveSearchMode} />
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <SearchBox
            activeSearchMode={activeSearchMode}
            draftQ={draftQ}
            q={q}
            setDraftQ={setDraftQ}
            commitSearch={commitSearch}
            clearSearch={clearSearch}
            isMultiIccid={isMultiIccid}
            iccidCount={iccidList.length}
          />
          <Btn
            variant={draftQ.trim() !== q.trim() ? "primary" : "outline"}
            size="sm"
            icon={<Icon.search size={13} />}
            onClick={commitSearch}
          >
            Buscar
          </Btn>
        </div>
      </div>

      {isMultiIccid && (
        <p style={{ fontSize: 12, color: T.muted, margin: "6px 0 0", lineHeight: 1.4 }}>
          {iccidList.length} ICCIDs detectados — se consultarán en {activeSrc === "all" ? "todos los proveedores" : SOURCES[activeSrc].name} al buscar.
        </p>
      )}
      {!isMultiIccid && draftQ.trim() && !isExactIccidQuery(draftQ.trim()) && activeSrc === "all" && (
        <p style={{ fontSize: 12, color: T.muted, margin: "6px 0 0", lineHeight: 1.4 }}>
          La búsqueda por texto aplica solo a Kite y Tele2. Moabits no admite filtros de texto — selecciona la fuente Moabits para buscarlo directamente.
        </p>
      )}

      <SourceFilterTabs
        activeSource={activeSrc}
        providerIds={activeProviderIds}
        onChange={onSourceChange}
      />

      <KpiStrip
        rows={rows}
        scope={viewScope}
        activeSrc={activeSrc}
        filters={advancedFilterValues}
      />

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <StatusFilterControls
          activeSrc={activeSrc}
          activeStatus={activeStatus}
          statusSelections={statusSelections}
          activeProviders={activeProviderIds}
          statusCount={statusCount}
          selectedCount={statusFilterCount}
          onActiveStatusChange={onActiveStatusChange}
          onClearSelections={onClearStatusSelections}
          onToggleSelection={onToggleStatusSelection}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: T.fontMono }}>
            {rows.length} resultado{rows.length !== 1 ? "s" : ""}
          </div>
          <AdvancedFiltersButton count={advancedCount} onClick={onOpenAdvancedFilters} />
        </div>
      </div>
    </div>
  )
}
