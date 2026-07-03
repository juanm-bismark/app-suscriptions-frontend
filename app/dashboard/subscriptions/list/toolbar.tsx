"use client"

import { isExactIccidQuery, type SearchMode } from "@/lib/sim-identifiers"
import { Btn, Icon } from "../primitives"
import { SourceFilterTabs, type SourceFilter } from "../filters/source-filter"
import { StatusFilterControls } from "../filters/status-filter-controls"
import type { NativeStatusSelections } from "../filters/status-filter"
import { KpiStrip } from "./kpi-strip"
import type { StatusFilter, ViewScope } from "./types"
import type { SourceId } from "../tokens"
import { SOURCES } from "../tokens"
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
    <div className="border-b border-border bg-card px-6 pb-4 pt-[22px]">
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-muted">
            Búsqueda unificada
          </div>
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.4px] text-title">
            Suscripciones
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
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

      <div className="grid gap-1.5">
        <SearchModeControl activeSearchMode={activeSearchMode} onChange={setActiveSearchMode} />
        <div className="flex items-stretch gap-2">
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
        <p className="m-0 mt-1.5 text-xs leading-[1.4] text-muted">
          {iccidList.length} ICCIDs detectados — se consultarán en {activeSrc === "all" ? "todos los proveedores" : SOURCES[activeSrc].name} al buscar.
        </p>
      )}
      {!isMultiIccid && draftQ.trim() && !isExactIccidQuery(draftQ.trim()) && activeSrc === "all" && (
        <p className="m-0 mt-1.5 text-xs leading-[1.4] text-muted">
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

      <div className="mt-3 grid gap-2.5">
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-xs text-muted">
            {rows.length} resultado{rows.length !== 1 ? "s" : ""}
          </div>
          <AdvancedFiltersButton count={advancedCount} onClick={onOpenAdvancedFilters} />
        </div>
      </div>
    </div>
  )
}
