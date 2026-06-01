import { toRow, type SubscriptionRow } from "@/lib/api/sim-mapper"
import { ApiError } from "@/lib/api-client"
import { listSims, type ListSimsParams } from "@/lib/api/sims"
import type { SimDetailsOut, SimListOut, Provider } from "@/lib/types/api"
import type { FailedProvider, LoadSubscriptionsData, LoadSubscriptionsResult, ProviderStatus } from "@/lib/subscriptions/types"
import { dedupeFailedProviders, toFailedProvider } from "./errors"

export function emptySubscriptionResult(filters: LoadSubscriptionsData["filters"]): LoadSubscriptionsResult {
  return {
    ok: true,
    data: {
      rows: [],
      pagination: {
        nextCursor: null,
        total: 0,
        partial: false,
        failedProviders: [],
        providerStatuses: [],
      },
      filters,
    },
  }
}

export function detailLookupResult(details: SimDetailsOut, filters: LoadSubscriptionsData["filters"]): LoadSubscriptionsResult {
  const rows = Object.entries(details.results).flatMap(([iccid, detail]) => {
    if (detail.status === "ok" && detail.data) return [toRow(detail.data)]
    return [emptyDetailRow(iccid, detail.provider)]
  })

  return {
    ok: true,
    data: {
      rows,
      detailLookup: details,
      pagination: {
        nextCursor: null,
        total: details.summary.total,
        partial: details.summary.ok !== details.summary.total || details.unresolved.length > 0 || details.filtered_out.length > 0,
        failedProviders: [],
        providerStatuses: [],
      },
      filters,
    },
  }
}

export function simListResult(result: SimListOut, filters: LoadSubscriptionsData["filters"]): LoadSubscriptionsResult {
  return {
    ok: true,
    data: {
      rows: (result.items ?? []).map(toRow),
      pagination: {
        nextCursor: result.next_cursor,
        total: result.total,
        partial: result.partial,
        failedProviders: dedupeFailedProviders(result.failed_providers ?? []),
        providerStatuses: result.provider_statuses ?? [],
      },
      filters,
    },
  }
}

export function mergeLoadSubscriptionResults(
  results: LoadSubscriptionsResult[],
  filters: LoadSubscriptionsData["filters"],
): LoadSubscriptionsResult {
  const rows = new Map<string, SubscriptionRow>()
  const failedProviders: FailedProvider[] = []
  const providerStatuses: ProviderStatus[] = []
  let partial = false

  for (const result of results) {
    if (!result.ok) {
      partial = true
      if (result.kind === "routing_map_empty") failedProviders.push(...result.failedProviders)
      else failedProviders.push({ provider: "global", code: "provider.unavailable", title: result.error })
      continue
    }

    for (const row of result.data.rows) rows.set(`${row.provider}:${row.iccid}`, row)
    failedProviders.push(...result.data.pagination.failedProviders)
    providerStatuses.push(...result.data.pagination.providerStatuses)
    partial = partial || result.data.pagination.partial
  }

  return {
    ok: true,
    data: {
      rows: Array.from(rows.values()),
      pagination: {
        nextCursor: null,
        total: rows.size,
        partial: partial || failedProviders.length > 0,
        failedProviders: dedupeFailedProviders(failedProviders),
        providerStatuses,
      },
      filters,
    },
  }
}

export async function findFirstUsefulGlobalPage(
  initial: SimListOut,
  baseParams: ListSimsParams,
  activeProviders: readonly Provider[],
): Promise<SimListOut> {
  const normalizedResult = normalizeSimListResult(initial)

  if (normalizedResult.items.length > 0 || normalizedResult.failed_providers.length === 0) {
    return normalizedResult
  }

  return fallbackToProviderListings(normalizedResult, baseParams, activeProviders)
}

export function normalizeSimListResult(initial: SimListOut): SimListOut {
  return {
    ...initial,
    items: initial.items ?? [],
    failed_providers: dedupeFailedProviders(initial.failed_providers ?? []),
    provider_statuses: initial.provider_statuses ?? [],
  }
}

async function fallbackToProviderListings(
  globalResult: SimListOut,
  baseParams: ListSimsParams,
  activeProviders: readonly Provider[],
): Promise<SimListOut> {
  const failedProviderIds = new Set((globalResult.failed_providers ?? []).map((failed) => failed.provider))
  const items: SimListOut["items"] = []
  const failedProviders = [...(globalResult.failed_providers ?? [])]
  const limit = baseParams.limit ?? 50

  for (const provider of activeProviders) {
    if (failedProviderIds.has(provider) || items.length >= limit) continue

    try {
      const providerResult = await listSims({
        ...baseParams,
        provider,
        cursor: null,
        limit: limit - items.length,
        modified_since: provider === "tele2" ? baseParams.modified_since : undefined,
      })
      items.push(...(providerResult.items ?? []))
      failedProviders.push(...(providerResult.failed_providers ?? []))
    } catch (error) {
      failedProviders.push(toFailedProvider(provider, error))
    }
  }

  return {
    ...globalResult,
    items,
    next_cursor: items.length > 0 ? null : globalResult.next_cursor,
    total: items.length > 0 ? null : globalResult.total,
    partial: true,
    failed_providers: dedupeFailedProviders(failedProviders),
    provider_statuses: globalResult.provider_statuses ?? [],
  }
}

function emptyDetailRow(iccid: string, provider: Provider): SubscriptionRow {
  return {
    iccid,
    provider,
    msisdn: null,
    imsi: null,
    status: "UNKNOWN",
    nativeStatus: "UNKNOWN",
    statusLabel: "Desconocida",
    statusGroup: "unknown",
    statusGroupLabel: null,
    customerName: null,
    customerScope: null,
    planName: null,
    planCode: null,
    planId: null,
    planDisplay: "—",
    activatedAt: null,
    updatedAt: null,
    imei: null,
    operator: null,
    country: null,
    ratType: null,
    ipAddress: null,
    dataService: null,
    smsService: null,
    lastLuAt: null,
    lastCdrAt: null,
    firstCdrMonth: null,
    connectivityImsi: null,
    communicationPlan: null,
    autorenewal: null,
    alias: null,
    commercialGroup: null,
    supervisionGroup: null,
    servicePack: null,
    accountId: null,
    endConsumerId: null,
    deviceId: null,
    modemId: null,
    eid: null,
    euiccid: null,
    simProfileId: null,
    fixedIpAddress: null,
    productCode: null,
    companyCode: null,
    dataLimitMb: null,
    smsLimit: null,
    accountCustoms: Array.from({ length: 10 }, () => null),
    operatorCustoms: Array.from({ length: 5 }, () => null),
    customerCustoms: Array.from({ length: 5 }, () => null),
    customField1: null,
    customField2: null,
    customField3: null,
    customField4: null,
  }
}

export function isRoutingMapEmpty(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === 412 &&
    error.code === "subscription.listing_precondition_failed" &&
    error.extra?.reason === "routing_map_empty"
  )
}
