"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { loadSubscriptions } from "@/app/actions/subscriptions"
import { normalizeSubscriptionFilters } from "@/lib/subscriptions/filters"
import type { LoadSubscriptionsData, LoadSubscriptionsInput } from "@/lib/subscriptions/types"
import { isSearchField, type SearchMode } from "@/lib/sim-identifiers"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { AdvancedFiltersDrawer } from "./filters/advanced-filters-drawer"
import { useAdvancedSubscriptionFilters } from "./filters/advanced-filters"
import { DetailModal } from "./detail-modal"
import { getEffectiveSource, PROVIDER_IDS, sanitizeProviderIds, type SourceFilter } from "./filters/source-filter"
import { countStatusSelections, isKnownNativeStatus, normalizeStatusValue, parseStatusSelections, serializeStatusSelections, toggleStatusSelection } from "./filters/status-filter"
import { EmptyState, ErrorState, LoadingState } from "./state-views"
import { DetailsQueryNotice, DetailsResolutionNotice, ListEmptyShell, NoActiveProvidersState, PartialProvidersNotice, RoutingMapEmptyState } from "./list/notices"
import { SubscriptionsPaginationControls } from "./list/pagination"
import {
  STALE_TIME_MS,
  useFilteredSubscriptionRows,
  useHydrateProviderCaches,
  useRoutingSyncJob,
  useStatusAndProviderCounts,
  useSubscriptionDetailQueries,
  useSubscriptionsListQuery,
  useSubscriptionsUrlState,
} from "./list/hooks"
import { queryRequestsFor, summarizeSubscriptionQueryResults } from "./list/query"
import { DefaultTable, MoabitsTable } from "./list/tables"
import { SubscriptionsToolbar } from "./list/toolbar"
import type { ViewScope } from "./list/types"
import { pageSizeFrom } from "./list/url"
import { type SourceId, T } from "./tokens"

export function SubscriptionsClient({
  filters,
  isAdmin = false,
  activeProviders,
  hasCompanyScope = true,
}: {
  filters?: LoadSubscriptionsInput
  isAdmin?: boolean
  activeProviders?: SourceId[] | null
  hasCompanyScope?: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const retry = () => router.refresh()
  const stateOverride = searchParams.get("state")
  const viewScope: ViewScope = isAdmin && filters?.scope === "global" ? "global" : "company"
  const loadingProviders = viewScope === "global" ? PROVIDER_IDS : sanitizeProviderIds(activeProviders)
  if (stateOverride === "loading") return <LoadingState filters={filters} activeProviders={loadingProviders} />
  if (stateOverride === "error") return <ErrorState query={filters?.q || undefined} onRetry={retry} />
  if (stateOverride === "empty") return <ListEmptyShell query={filters?.q || undefined} />
  return <SubscriptionsLoader filters={filters} isAdmin={isAdmin} activeProviders={activeProviders} hasCompanyScope={hasCompanyScope} />
}

function SubscriptionsLoader({
  filters,
  isAdmin,
  activeProviders,
  hasCompanyScope,
}: {
  filters?: LoadSubscriptionsInput
  isAdmin?: boolean
  activeProviders?: SourceId[] | null
  hasCompanyScope?: boolean
}) {
  const viewScope: ViewScope = isAdmin && filters?.scope === "global" ? "global" : "company"
  const activeProviderIds = useMemo(() => viewScope === "global" ? PROVIDER_IDS : sanitizeProviderIds(activeProviders), [activeProviders, viewScope])
  const q = filters?.q ?? ""
  const cursor = filters?.cursor ?? ""
  const pageSize = pageSizeFrom(filters?.size)
  const rawSearchField = filters?.searchField
  const searchMode: SearchMode = isSearchField(rawSearchField) ? rawSearchField : "auto"
  const effectiveSource = getEffectiveSource(filters?.provider, activeProviderIds)
  const selectedProvider = effectiveSource === "all" ? undefined : effectiveSource
  const selectedStatus =
    selectedProvider && isKnownNativeStatus(selectedProvider, filters?.status)
      ? normalizeStatusValue(filters?.status)
      : undefined
  const statusSelections = useMemo(
    () => (selectedProvider ? {} : parseStatusSelections(filters?.statuses, activeProviderIds)),
    [activeProviderIds, filters?.statuses, selectedProvider],
  )
  const queryRequests = useMemo(
    () => activeProviderIds.length ? queryRequestsFor(selectedProvider, q, selectedStatus, statusSelections, activeProviderIds, searchMode) : [],
    [activeProviderIds, q, searchMode, selectedProvider, selectedStatus, statusSelections],
  )
  const listFilters: LoadSubscriptionsData["filters"] = normalizeSubscriptionFilters({
    scope: viewScope,
    provider: selectedProvider,
    status: selectedStatus,
    statuses: selectedProvider ? undefined : serializeStatusSelections(statusSelections, activeProviderIds) ?? undefined,
    cursor,
    q,
    searchField: searchMode === "auto" ? undefined : searchMode,
  }, { activeProviders: activeProviderIds, scope: viewScope })

  const results = useQueries({
    queries: queryRequests.map((request) => ({
      queryKey: ["subscriptions", viewScope, request.provider ?? "global", request.searchField ?? "", request.status ?? "", request.statuses ?? "", request.iccid ?? q, request.iccid ? "" : cursor, pageSize] as const,
      queryFn: async () => {
        const result = await loadSubscriptions({ scope: viewScope, provider: request.provider, status: request.status, statuses: request.statuses, q: request.iccid ?? filters?.q, searchField: request.searchField, cursor: request.iccid ? undefined : filters?.cursor, limit: pageSize })
        if (!result.ok && result.kind === "error") throw new Error(result.error)
        return result
      },
      retry: false,
      staleTime: STALE_TIME_MS,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const allFailed = results.every((r) => r.isError || (r.data && !r.data.ok))
  const { allRows, failedProviders, providerStatuses, hasPartial, nextCursor, resultTotal, initialDetailLookup } = useMemo(
    () => summarizeSubscriptionQueryResults(queryRequests, results),
    [queryRequests, results],
  )

  if (activeProviderIds.length === 0) {
    if (!isAdmin) return <NoActiveProvidersState />
    return (
      <SubscriptionsList
        key={`${viewScope}:empty`}
        rows={[]}
        pagination={{ nextCursor: null, total: 0, partial: false, failedProviders: [], providerStatuses: [] }}
        filters={listFilters}
        initialSource="all"
        isAdmin={isAdmin}
        activeProviders={activeProviderIds}
        viewScope={viewScope}
        hasCompanyScope={hasCompanyScope}
        initialDetailLookup={undefined}
      />
    )
  }

  if (isLoading) return <LoadingState filters={filters} activeProviders={activeProviderIds} />

  if (allFailed) {
    const routingEmpty = results.find((r) => r.data && !r.data.ok && r.data.kind === "routing_map_empty")
    if (routingEmpty?.data && !routingEmpty.data.ok && routingEmpty.data.kind === "routing_map_empty") {
      return <RoutingMapEmptyState failedProviders={routingEmpty.data.failedProviders} activeProviders={activeProviderIds} />
    }
    return (
      <SubscriptionsList
        key={`${viewScope}:${selectedProvider ?? "all"}:${filters?.status ?? ""}:${filters?.statuses ?? ""}:${q}:${cursor}:${pageSize}`}
        rows={[]}
        pagination={{ nextCursor: null, total: 0, partial: true, failedProviders, providerStatuses: [] }}
        filters={listFilters}
        initialSource={selectedProvider ?? "all"}
        isAdmin={isAdmin}
        activeProviders={activeProviderIds}
        viewScope={viewScope}
        hasCompanyScope={hasCompanyScope}
        initialDetailLookup={undefined}
      />
    )
  }

  const initialSource: SourceFilter = selectedProvider ?? "all"

  return (
    <SubscriptionsList
      key={`${viewScope}:${initialSource}:${filters?.status ?? ""}:${filters?.statuses ?? ""}:${q}:${cursor}:${pageSize}`}
      rows={allRows}
      pagination={{ nextCursor, total: resultTotal, partial: hasPartial || failedProviders.length > 0, failedProviders, providerStatuses }}
      filters={listFilters}
      initialSource={initialSource}
      isAdmin={isAdmin}
      activeProviders={activeProviderIds}
      viewScope={viewScope}
      hasCompanyScope={hasCompanyScope}
      initialDetailLookup={initialDetailLookup}
    />
  )
}

function SubscriptionsList({
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
  const {
    activeProviderIds,
    activeSearchMode,
    activeSrc,
    activeStatus,
    changeSource,
    clearSearch,
    commitSearch,
    currentPageSize,
    cursorStack,
    draftQ,
    iccidList,
    isMultiIccid,
    page,
    pathname,
    q,
    searchParams,
    setActiveSearchMode,
    setActiveStatus,
    setDraftQ,
    setStatusSelections,
    statusSelections,
    switchViewScope,
  } = useSubscriptionsUrlState({
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
  const advancedFilters = useAdvancedSubscriptionFilters(activeSrc)
  const [isDataRefreshing, setIsDataRefreshing] = useState(false)
  const { listedRows } = useSubscriptionsListQuery({
    initialRows,
    viewScope,
    activeSrc,
    activeStatus,
    statusSelections,
    q,
    activeSearchMode,
    currentPageSize,
    activeProviderIds,
    advancedFilters,
  })
  const { detailsQuery, enrichedRows: enrichedInitialRows } = useSubscriptionDetailQueries({
    listedRows,
    activeSrc,
    viewScope,
    initialDetailLookup,
  })
  const { activeJobQuery, triggerProviderSync, triggerSyncMutation } = useRoutingSyncJob({ isAdmin })
  useHydrateProviderCaches({ activeProviderIds, allRows: initialRows, q, viewScope })
  const rows = useFilteredSubscriptionRows({
    enrichedInitialRows,
    activeSrc,
    activeStatus,
    statusSelections,
    activeProviderIds,
    advancedFilters: advancedFilters.filters,
    isMultiIccid,
    iccidList,
    draftQ,
    activeSearchMode,
  })

  const statusFilterCount = activeSrc === "all" ? countStatusSelections(statusSelections, activeProviderIds) : activeStatus === "all" ? 0 : 1
  const advCount = advancedFilters.count
  // When the user clicks a source tab, activeSrc changes before the URL updates.
  // During that transition, pagination metadata (cursor, total) is still from the
  // previous query scope — using it would navigate with the wrong cursor. Suppress
  // it until the URL reflects the new source and the component remounts with
  // source-specific data.
  const isTransitioning = activeSrc !== initialSource
  const total = isTransitioning ? null : (pagination?.total ?? null)
  const effectiveNextCursor = isTransitioning ? null : (pagination?.nextCursor ?? null)
  const pageSize = currentPageSize
  const failedProviders = pagination?.failedProviders ?? []
  const hasPartialProviders = Boolean(pagination?.partial && failedProviders.length)
  const { statusCount, providerRowCounts } = useStatusAndProviderCounts(enrichedInitialRows)

  async function handleSincronizar() {
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

  if (isDataRefreshing) return <LoadingState filters={filters} activeProviders={activeProviderIds} />

  return (
    <div
      style={{
        background: T.pageBg,
        fontFamily: T.fontBody,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        minHeight: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      <SubscriptionsToolbar
        isAdmin={isAdmin}
        hasCompanyScope={hasCompanyScope}
        viewScope={viewScope}
        onSwitchViewScope={switchViewScope}
        onRefreshData={handleSincronizar}
        activeSearchMode={activeSearchMode}
        setActiveSearchMode={setActiveSearchMode}
        draftQ={draftQ}
        setDraftQ={setDraftQ}
        commitSearch={commitSearch}
        clearSearch={clearSearch}
        q={q}
        activeSrc={activeSrc}
        activeProviderIds={activeProviderIds}
        onSourceChange={changeSource}
        isMultiIccid={isMultiIccid}
        iccidList={iccidList}
        rows={rows}
        advancedFilterValues={advancedFilters.filters}
        activeStatus={activeStatus}
        statusSelections={statusSelections}
        statusCount={statusCount}
        statusFilterCount={statusFilterCount}
        onActiveStatusChange={setActiveStatus}
        onClearStatusSelections={() => setStatusSelections({})}
        onToggleStatusSelection={(provider, status) => setStatusSelections((prev) => toggleStatusSelection(prev, provider, status))}
        advancedCount={advCount}
        onOpenAdvancedFilters={() => setAdvOpen(true)}
      />

      <div style={{ padding: "0 24px 16px", background: T.cardBg, borderBottom: `1px solid ${T.border}`, display: "grid", gap: 10 }}>
        {detailsQuery.data && (detailsQuery.data.unresolved.length > 0 || detailsQuery.data.filtered_out.length > 0) && (
          <DetailsResolutionNotice
            unresolved={detailsQuery.data.unresolved}
            filteredOut={detailsQuery.data.filtered_out}
            activeProvider={activeSrc === "all" ? undefined : activeSrc}
            isAdmin={isAdmin}
            onRefreshRouting={activeSrc !== "all" && isAdmin ? () => triggerProviderSync(activeSrc) : undefined}
            isRefreshingRouting={
              activeSrc !== "all" &&
              ((triggerSyncMutation.variables === activeSrc && triggerSyncMutation.isPending) ||
                (activeJobQuery.data?.provider === activeSrc && activeJobQuery.data.status !== "done" && activeJobQuery.data.status !== "failed"))
            }
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

      <div style={{ flex: 1, overflow: "auto", background: T.cardBg, position: "relative" }}>
        {activeSrc === "moabits"
          ? <MoabitsTable
              rows={rows}
              detailsQuery={detailsQuery}
              hovered={hovered}
              setHovered={setHovered}
              setOpenRecord={setOpenRecord}
              emptyState={rows.length === 0 ? <EmptyState query={q || "tus filtros"} source={activeSrc} failedProviders={failedProviders} /> : null}
            />
          : <DefaultTable
              rows={rows}
              detailsQuery={detailsQuery}
              hovered={hovered}
              setHovered={setHovered}
              setOpenRecord={setOpenRecord}
              emptyState={rows.length === 0 ? <EmptyState query={q || "tus filtros"} source={activeSrc} failedProviders={failedProviders} /> : null}
            />
        }
      </div>

      <AdvancedFiltersDrawer
        open={advOpen}
        filters={advancedFilters.filters}
        activeSrc={activeSrc}
        activeProviderIds={activeProviderIds}
        providerCounts={providerRowCounts}
        totalRows={enrichedInitialRows.length}
        rowsCount={rows.length}
        isAdmin={isAdmin}
        onClose={() => setAdvOpen(false)}
        onReset={advancedFilters.reset}
        onFilterChange={advancedFilters.setFilter}
        onArrayFilterValueChange={advancedFilters.setArrayFilterValue}
      />

      <div
        style={{
          padding: "10px 24px",
          background: T.cardBg,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <SubscriptionsPaginationControls
          page={page}
          size={pageSize}
          rowsShown={rows.length}
          total={total}
          partial={pagination?.partial ?? false}
          partialLabel={hasPartialProviders ? "respuesta parcial por fuente" : "respuesta parcial"}
          nextCursor={effectiveNextCursor}
          currentCursor={filters.cursor ?? ""}
          cursorStack={cursorStack}
          pathname={pathname}
          searchParams={searchParams}
        />
      </div>

      <DetailModal
        record={openRecord}
        selectedProvider={activeSrc === "all" ? undefined : activeSrc}
        onClose={() => setOpenRecord(null)}
      />
    </div>
  )
}
