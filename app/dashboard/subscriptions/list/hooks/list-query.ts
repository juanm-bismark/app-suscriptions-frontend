"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { loadSubscriptions } from "@/app/actions/subscriptions"
import { useQuery } from "@tanstack/react-query"
import type { SearchMode } from "@/lib/sim-identifiers"
import type { useAdvancedSubscriptionFilters } from "../../filters/advanced-filters"
import { serializeStatusSelections, type NativeStatusSelections } from "../../filters/status-filter"
import type { SourceId } from "../../tokens"
import type { SourceFilter } from "../../filters/source-filter"
import type { StatusFilter, ViewScope } from "../types"
import { STALE_TIME_MS } from "./constants"

type AdvancedFiltersState = ReturnType<typeof useAdvancedSubscriptionFilters>

export function useSubscriptionsListQuery({
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
}: {
  initialRows: SubscriptionRow[]
  viewScope: ViewScope
  activeSrc: SourceFilter
  activeStatus: StatusFilter
  statusSelections: NativeStatusSelections
  q: string
  activeSearchMode: SearchMode
  currentPageSize: number
  activeProviderIds: SourceId[]
  advancedFilters: AdvancedFiltersState
}) {
  const serverFilteredQuery = useQuery({
    queryKey: [
      "subscriptions-advanced",
      viewScope,
      activeSrc,
      activeStatus,
      serializeStatusSelections(statusSelections, activeProviderIds),
      q,
      activeSearchMode,
      currentPageSize,
      advancedFilters.queryKey,
    ] as const,
    queryFn: async () => {
      const result = await loadSubscriptions({
        scope: viewScope,
        provider: activeSrc === "all" ? undefined : activeSrc,
        status: activeSrc !== "all" && activeStatus !== "all" ? activeStatus : undefined,
        statuses: activeSrc === "all" ? serializeStatusSelections(statusSelections, activeProviderIds) ?? undefined : undefined,
        q,
        searchField: activeSearchMode === "auto" ? undefined : activeSearchMode,
        limit: currentPageSize,
        ...advancedFilters.requestInput,
      })
      if (!result.ok) throw new Error(result.kind === "error" ? result.error : "No se pudo cargar la lista filtrada")
      return result.data
    },
    enabled: advancedFilters.hasServerFilters,
    retry: false,
    staleTime: STALE_TIME_MS,
  })

  return {
    serverFilteredQuery,
    listedRows: advancedFilters.hasServerFilters && serverFilteredQuery.data ? serverFilteredQuery.data.rows : initialRows,
  }
}
