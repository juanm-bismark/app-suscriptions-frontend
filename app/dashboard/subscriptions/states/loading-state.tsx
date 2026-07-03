"use client"

import { getEffectiveSource, PROVIDER_IDS, sanitizeProviderIds } from "../filters/source-filter"
import { countStatusSelections, hasStatusSelections, parseStatusSelections } from "../filters/status-filter"
import { type SourceId, SOURCES, T } from "../tokens"
import {
  LoadingFooter,
  LoadingTableRows,
  LoadingToolbar,
  loadingLabel,
  providersForLoadingRows,
} from "./loading"

type LoadingFilters = {
  provider?: string
  status?: string
  statuses?: string
  cursor?: string
  size?: string
  q?: string
  searchField?: string
}

export function LoadingState({
  query,
  filters,
  activeProviders,
}: {
  query?: string
  filters?: LoadingFilters
  activeProviders?: SourceId[] | null
}) {
  const effectiveQuery = query ?? filters?.q
  const hasQuery = Boolean(effectiveQuery?.trim())
  const activeProviderIds = sanitizeProviderIds(activeProviders)
  const displayProviderIds = activeProviderIds.length ? activeProviderIds : PROVIDER_IDS
  const activeSource = getEffectiveSource(filters?.provider, activeProviderIds)
  const activeStatus = activeSource !== "all" ? filters?.status?.trim() || undefined : undefined
  const statusSelections = activeSource === "all" ? parseStatusSelections(filters?.statuses, displayProviderIds) : {}
  const selectedCount = activeSource === "all" ? countStatusSelections(statusSelections, displayProviderIds) : activeStatus ? 1 : 0
  const anySelected = activeSource === "all" ? hasStatusSelections(statusSelections, displayProviderIds) : Boolean(activeStatus)
  const activeColor = activeSource === "all" ? T.headerAccent : SOURCES[activeSource].color
  const rowsSourceCycle = providersForLoadingRows(activeSource, statusSelections, displayProviderIds)
  const label = loadingLabel(activeSource, activeStatus, statusSelections, effectiveQuery, displayProviderIds)

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-page">
      <LoadingToolbar
        effectiveQuery={effectiveQuery}
        hasQuery={hasQuery}
        activeSource={activeSource}
        displayProviderIds={displayProviderIds}
        activeStatus={activeStatus}
        statusSelections={statusSelections}
        selectedCount={selectedCount}
        anySelected={anySelected}
        activeColor={activeColor}
        label={label}
      />
      <LoadingTableRows rowsSourceCycle={rowsSourceCycle} />
      <LoadingFooter cursor={filters?.cursor} label={label} />
    </div>
  )
}
