"use client"

import { loadSubscriptions } from "@/app/actions/subscriptions"
import { normalizeSubscriptionFilters } from "@/lib/subscriptions/filters"
import type { LoadSubscriptionsData, LoadSubscriptionsInput } from "@/lib/subscriptions/types"
import { isSearchField, type SearchMode } from "@/lib/sim-identifiers"
import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { getEffectiveSource, PROVIDER_IDS, sanitizeProviderIds, type SourceFilter } from "../filters/source-filter"
import { isKnownNativeStatus, normalizeStatusValue, parseStatusSelections, serializeStatusSelections } from "../filters/status-filter"
import { LoadingState } from "../state-views"
import { NoActiveProvidersState, RoutingMapEmptyState } from "./notices"
import { STALE_TIME_MS } from "./hooks"
import { queryRequestsFor, summarizeSubscriptionQueryResults } from "./query"
import type { ViewScope } from "./types"
import { pageSizeFrom } from "./url"
import type { SourceId } from "../tokens"
import { SubscriptionsListShell } from "./shell"

export function SubscriptionsLoader({
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

  const isLoading = results.some((result) => result.isLoading)
  const allFailed = results.every((result) => result.isError || (result.data && !result.data.ok))
  const { allRows, failedProviders, providerStatuses, hasPartial, nextCursor, resultTotal, initialDetailLookup } = useMemo(
    () => summarizeSubscriptionQueryResults(queryRequests, results),
    [queryRequests, results],
  )

  if (activeProviderIds.length === 0) {
    if (!isAdmin) return <NoActiveProvidersState />
    return (
      <SubscriptionsListShell
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
    const routingEmpty = results.find((result) => result.data && !result.data.ok && result.data.kind === "routing_map_empty")
    if (routingEmpty?.data && !routingEmpty.data.ok && routingEmpty.data.kind === "routing_map_empty") {
      return <RoutingMapEmptyState failedProviders={routingEmpty.data.failedProviders} activeProviders={activeProviderIds} />
    }
    return (
      <SubscriptionsListShell
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
    <SubscriptionsListShell
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

