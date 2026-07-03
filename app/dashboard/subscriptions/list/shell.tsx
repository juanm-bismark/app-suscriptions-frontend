"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { LoadSubscriptionsData } from "@/lib/subscriptions/types"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { AdvancedFiltersDrawer } from "../filters/advanced-filters-drawer"
import { useAdvancedSubscriptionFilters } from "../filters/advanced-filters"
import { DetailModal } from "../detail-modal"
import { PROVIDER_IDS, type SourceFilter } from "../filters/source-filter"
import { countStatusSelections, toggleStatusSelection } from "../filters/status-filter"
import { EmptyState, LoadingState } from "../state-views"
import type { SourceId } from "../tokens"
import {
  useFilteredSubscriptionRows,
  useHydrateProviderCaches,
  useRoutingSyncJob,
  useStatusAndProviderCounts,
  useSubscriptionDetailQueries,
  useSubscriptionsListQuery,
  useSubscriptionsUrlState,
} from "./hooks"
import { DetailsQueryNotice, DetailsResolutionNotice, PartialProvidersNotice } from "./notices"
import { SubscriptionsPaginationControls } from "./pagination"
import { DefaultTable, MoabitsTable } from "./tables"
import { SubscriptionsToolbar } from "./toolbar"
import type { ViewScope } from "./types"

export function SubscriptionsListShell({
  rows: initialRows,
  pagination,
  filters,
  initialSource = "all",
  isAdmin = false,
  activeProviders = PROVIDER_IDS,
  viewScope = "company",
  hasCompanyScope = true,
  initialDetailLookup,
}: {
  rows: SubscriptionRow[]
  pagination: LoadSubscriptionsData["pagination"]
  filters: LoadSubscriptionsData["filters"]
  initialSource?: SourceFilter
  isAdmin?: boolean
  activeProviders?: SourceId[] | null
  viewScope?: ViewScope
  hasCompanyScope?: boolean
  initialDetailLookup?: LoadSubscriptionsData["detailLookup"]
}) {
  const queryClient = useQueryClient()
  const urlState = useSubscriptionsUrlState({
    filters,
    initialSource,
    activeProviders,
    viewScope,
    isAdmin,
    hasCompanyScope,
  })

  const [hovered, setHovered] = useState<string | null>(null)
  const [openRecord, setOpenRecord] = useState<SubscriptionRow | null>(null)
  const [advOpen, setAdvOpen] = useState(false)
  const advancedFilters = useAdvancedSubscriptionFilters(urlState.activeSrc)
  const [isDataRefreshing, setIsDataRefreshing] = useState(false)
  const { listedRows } = useSubscriptionsListQuery({
    initialRows,
    viewScope,
    activeSrc: urlState.activeSrc,
    activeStatus: urlState.activeStatus,
    statusSelections: urlState.statusSelections,
    q: urlState.q,
    activeSearchMode: urlState.activeSearchMode,
    currentPageSize: urlState.currentPageSize,
    activeProviderIds: urlState.activeProviderIds,
    advancedFilters,
  })
  const { detailsQuery, enrichedRows: enrichedInitialRows } = useSubscriptionDetailQueries({
    listedRows,
    activeSrc: urlState.activeSrc,
    viewScope,
    initialDetailLookup,
  })
  const { activeJobQuery, triggerProviderSync, triggerSyncMutation } = useRoutingSyncJob({ isAdmin })
  useHydrateProviderCaches({ activeProviderIds: urlState.activeProviderIds, allRows: initialRows, q: urlState.q, viewScope })
  const rows = useFilteredSubscriptionRows({
    enrichedInitialRows,
    activeSrc: urlState.activeSrc,
    activeStatus: urlState.activeStatus,
    statusSelections: urlState.statusSelections,
    activeProviderIds: urlState.activeProviderIds,
    advancedFilters: advancedFilters.filters,
    isMultiIccid: urlState.isMultiIccid,
    iccidList: urlState.iccidList,
    draftQ: urlState.draftQ,
    activeSearchMode: urlState.activeSearchMode,
  })

  const statusFilterCount = urlState.activeSrc === "all" ? countStatusSelections(urlState.statusSelections, urlState.activeProviderIds) : urlState.activeStatus === "all" ? 0 : 1
  const isTransitioning = urlState.activeSrc !== initialSource
  const total = isTransitioning ? null : (pagination?.total ?? null)
  const effectiveNextCursor = isTransitioning ? null : (pagination?.nextCursor ?? null)
  const failedProviders = pagination?.failedProviders ?? []
  const hasPartialProviders = Boolean(pagination?.partial && failedProviders.length)
  const { statusCount, providerRowCounts } = useStatusAndProviderCounts(enrichedInitialRows)
  const selectedRoutingProvider = urlState.activeSrc === "all" ? undefined : urlState.activeSrc
  const activeRoutingJob = activeJobQuery.data
  const isSelectedRoutingJobActive = Boolean(
    selectedRoutingProvider &&
      activeRoutingJob &&
      activeRoutingJob.provider === selectedRoutingProvider &&
      activeRoutingJob.status !== "done" &&
      activeRoutingJob.status !== "failed",
  )
  const isSelectedRoutingMutationActive = Boolean(
    selectedRoutingProvider &&
      triggerSyncMutation.variables === selectedRoutingProvider &&
      triggerSyncMutation.isPending,
  )

  async function handleRefreshData() {
    setIsDataRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["sim-details"] }),
      ])
    } finally {
      setIsDataRefreshing(false)
    }
  }

  if (isDataRefreshing) return <LoadingState filters={filters} activeProviders={urlState.activeProviderIds} />

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col overflow-hidden bg-page text-text">
      <SubscriptionsToolbar
        isAdmin={isAdmin}
        hasCompanyScope={hasCompanyScope}
        viewScope={viewScope}
        onSwitchViewScope={urlState.switchViewScope}
        onRefreshData={handleRefreshData}
        activeSearchMode={urlState.activeSearchMode}
        setActiveSearchMode={urlState.setActiveSearchMode}
        draftQ={urlState.draftQ}
        setDraftQ={urlState.setDraftQ}
        commitSearch={urlState.commitSearch}
        clearSearch={urlState.clearSearch}
        q={urlState.q}
        activeSrc={urlState.activeSrc}
        activeProviderIds={urlState.activeProviderIds}
        onSourceChange={urlState.changeSource}
        isMultiIccid={urlState.isMultiIccid}
        iccidList={urlState.iccidList}
        rows={rows}
        advancedFilterValues={advancedFilters.filters}
        activeStatus={urlState.activeStatus}
        statusSelections={urlState.statusSelections}
        statusCount={statusCount}
        statusFilterCount={statusFilterCount}
        onActiveStatusChange={urlState.setActiveStatus}
        onClearStatusSelections={() => urlState.setStatusSelections({})}
        onToggleStatusSelection={(provider, status) => urlState.setStatusSelections((prev) => toggleStatusSelection(prev, provider, status))}
        advancedCount={advancedFilters.count}
        onOpenAdvancedFilters={() => setAdvOpen(true)}
      />

      <div className="grid gap-2.5 border-b border-border bg-card px-6 pb-4">
        {detailsQuery.data && (detailsQuery.data.unresolved.length > 0 || detailsQuery.data.filtered_out.length > 0) && (
          <DetailsResolutionNotice
            unresolved={detailsQuery.data.unresolved}
            filteredOut={detailsQuery.data.filtered_out}
            activeProvider={selectedRoutingProvider}
            isAdmin={isAdmin}
            onRefreshRouting={selectedRoutingProvider && isAdmin ? () => triggerProviderSync(selectedRoutingProvider) : undefined}
            isRefreshingRouting={isSelectedRoutingMutationActive || isSelectedRoutingJobActive}
          />
        )}
        {detailsQuery.isError && (
          <DetailsQueryNotice
            message={detailsQuery.error instanceof Error ? detailsQuery.error.message : "No se pudieron cargar los detalles"}
            onRetry={() => detailsQuery.refetch()}
          />
        )}
        {hasPartialProviders && <PartialProvidersNotice failedProviders={failedProviders} />}
      </div>

      <div className="relative flex-1 overflow-auto bg-card">
        {urlState.activeSrc === "moabits"
          ? <MoabitsTable
              rows={rows}
              detailsQuery={detailsQuery}
              hovered={hovered}
              setHovered={setHovered}
              setOpenRecord={setOpenRecord}
              emptyState={rows.length === 0 ? <EmptyState query={urlState.q || "tus filtros"} source={urlState.activeSrc} failedProviders={failedProviders} /> : null}
            />
          : <DefaultTable
              rows={rows}
              detailsQuery={detailsQuery}
              hovered={hovered}
              setHovered={setHovered}
              setOpenRecord={setOpenRecord}
              emptyState={rows.length === 0 ? <EmptyState query={urlState.q || "tus filtros"} source={urlState.activeSrc} failedProviders={failedProviders} /> : null}
            />
        }
      </div>

      <AdvancedFiltersDrawer
        open={advOpen}
        filters={advancedFilters.filters}
        activeSrc={urlState.activeSrc}
        activeProviderIds={urlState.activeProviderIds}
        providerCounts={providerRowCounts}
        totalRows={enrichedInitialRows.length}
        rowsCount={rows.length}
        isAdmin={isAdmin}
        onClose={() => setAdvOpen(false)}
        onReset={advancedFilters.reset}
        onFilterChange={advancedFilters.setFilter}
        onArrayFilterValueChange={advancedFilters.setArrayFilterValue}
      />

      <div className="flex items-center border-t border-border bg-card px-6 py-2.5">
        <SubscriptionsPaginationControls
          page={urlState.page}
          size={urlState.currentPageSize}
          rowsShown={rows.length}
          total={total}
          partial={pagination?.partial ?? false}
          partialLabel={hasPartialProviders ? "respuesta parcial por fuente" : "respuesta parcial"}
          nextCursor={effectiveNextCursor}
          currentCursor={filters.cursor ?? ""}
          cursorStack={urlState.cursorStack}
          pathname={urlState.pathname}
          searchParams={urlState.searchParams}
        />
      </div>

      <DetailModal
        record={openRecord}
        selectedProvider={urlState.activeSrc === "all" ? undefined : urlState.activeSrc}
        onClose={() => setOpenRecord(null)}
      />
    </div>
  )
}
