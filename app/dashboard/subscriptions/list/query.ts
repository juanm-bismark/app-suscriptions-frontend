import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { FailedProvider, LoadSubscriptionsData, LoadSubscriptionsResult, SearchField } from "@/lib/subscriptions/types"
import { MAX_ICCID_BATCH, parseIccidList } from "@/lib/iccid"
import { identifierSearchFields, isExactIccidQuery, type SearchMode } from "@/lib/sim-identifiers"
import { hasStatusSelections, serializeStatusSelections, type NativeStatusSelections } from "../filters/status-filter"
import type { SourceId } from "../tokens"

const SEARCHABLE_PROVIDER_IDS: SourceId[] = ["kite", "tele2"]

type QueryScope = SourceId | "global"

export interface QueryRequest {
  provider?: SourceId
  status?: string
  statuses?: string
  iccid?: string
  searchField?: SearchField
  key: string
  failureProvider: string
}

type SubscriptionQueryState = {
  data?: LoadSubscriptionsResult
  isError: boolean
  error: unknown
}

export function queryRequestsFor(
  selectedProvider: SourceId | undefined,
  query: string,
  selectedStatus: string | undefined,
  statusSelections: NativeStatusSelections,
  providerIds: readonly SourceId[],
  searchMode: SearchMode,
): QueryRequest[] {
  const iccids = searchMode === "auto" || searchMode === "iccid" ? parseIccidList(query) : []
  if (iccids.length > 1) {
    const scope = selectedProvider ?? "global"
    const batch = iccids.slice(0, MAX_ICCID_BATCH)
    return [{
      provider: selectedProvider,
      iccid: batch.join(","),
      key: `iccids:${scope}:${batch.sort().join(",")}`,
      failureProvider: scope,
    }]
  }

  if (selectedProvider) {
    const identifierFields = identifierSearchFields(query, searchMode)
    if (identifierFields.length) {
      return identifierFields.map((searchField) => ({
        provider: selectedProvider,
        status: selectedStatus,
        searchField,
        key: `${selectedProvider}:${searchField}:${selectedStatus ?? "all"}:${query.trim()}`,
        failureProvider: selectedProvider,
      }))
    }
    return [{ provider: selectedProvider, status: selectedStatus, key: `${selectedProvider}:${selectedStatus ?? "all"}`, failureProvider: selectedProvider }]
  }

  if (hasStatusSelections(statusSelections, providerIds)) {
    const statuses = serializeStatusSelections(statusSelections, providerIds)
    const explicitSearchField = searchMode === "auto" ? undefined : searchMode
    return statuses ? [{ statuses, searchField: explicitSearchField, key: `search:${explicitSearchField ?? "auto"}:${statuses}`, failureProvider: "global" }] : []
  }

  const identifierFields = identifierSearchFields(query, searchMode)
  if (identifierFields.length) {
    return identifierFields.map((searchField) => ({
      searchField,
      key: `global:${searchField}:${query.trim()}`,
      failureProvider: "global",
    }))
  }

  return scopesForQuery(selectedProvider, query, providerIds).map((scope) => ({
    provider: scope === "global" ? undefined : scope,
    key: scope,
    failureProvider: scope,
  }))
}

export function summarizeSubscriptionQueryResults(queryRequests: readonly QueryRequest[], results: readonly SubscriptionQueryState[]) {
  const rows: SubscriptionRow[] = []
  const seenRows = new Set<string>()
  const failedProviders: FailedProvider[] = []
  const providerStatuses: LoadSubscriptionsData["pagination"]["providerStatuses"] = []
  let hasPartial = false
  const canUseCursor = queryRequests.length === 1
  let okCount = 0
  let nextCursor: string | null = null
  let resultTotal: number | null = null
  let initialDetailLookup: LoadSubscriptionsData["detailLookup"] | undefined

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.data?.ok) {
      okCount += 1
      if (okCount === 1) {
        nextCursor = result.data.data.pagination.nextCursor
        resultTotal = result.data.data.pagination.total
        initialDetailLookup = result.data.data.detailLookup
      } else {
        nextCursor = null
        resultTotal = null
        initialDetailLookup = undefined
      }

      for (const row of result.data.data.rows ?? []) {
        const key = `${row.provider}:${row.iccid}`
        if (seenRows.has(key)) continue
        rows.push(row)
        seenRows.add(key)
      }

      failedProviders.push(...(result.data.data.pagination.failedProviders ?? []))
      providerStatuses.push(...(result.data.data.pagination.providerStatuses ?? []))
      if (result.data.data.pagination.partial) hasPartial = true
    } else if (result.isError || (result.data && !result.data.ok)) {
      failedProviders.push({
        provider: queryRequests[i]?.failureProvider ?? "global",
        code: "provider.unavailable",
        title: result.isError ? (result.error instanceof Error ? result.error.message : "No se pudo consultar") : "No se pudo consultar",
      })
    }
  }

  return {
    allRows: rows,
    failedProviders,
    providerStatuses,
    hasPartial,
    nextCursor: canUseCursor ? nextCursor : null,
    resultTotal: canUseCursor ? resultTotal : null,
    initialDetailLookup: canUseCursor ? initialDetailLookup : undefined,
  }
}

function scopesForQuery(selectedProvider: SourceId | undefined, query: string, providerIds: readonly SourceId[]): QueryScope[] {
  if (selectedProvider) return [selectedProvider]
  if (!query.trim() || isExactIccidQuery(query)) return ["global"]
  return query.trim() ? SEARCHABLE_PROVIDER_IDS.filter((provider) => providerIds.includes(provider)) : [...providerIds]
}
