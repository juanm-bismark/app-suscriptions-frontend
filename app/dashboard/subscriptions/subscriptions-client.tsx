"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { FailedProvider, LoadSubscriptionsData, LoadSubscriptionsInput, LoadSubscriptionsResult, SyncTriggerActionResult } from "@/app/actions/subscriptions"
import { loadJob, loadSimDetails, loadSimStats, loadSubscriptions, loadSyncStatus, triggerRoutingSync } from "@/app/actions/subscriptions"
import type { AsyncJobOut, SimDetailsResult, SyncStatusOut } from "@/lib/types/api"
import { isIccid, MAX_ICCID_BATCH, parseIccidList } from "@/lib/iccid"
import { positiveInt } from "@/lib/utils"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CSSProperties, ReactNode, useEffect, useMemo, useState, useTransition } from "react"
import { fmtShortDate } from "./data"
import { DetailModal } from "./detail-modal"
import { Btn, Chip, Icon, SourceBadge, StatusPillWithNative } from "./primitives"
import { EmptyState, ErrorState, LoadingState } from "./state-views"
import { PROVIDER_NATIVE_STATUSES, SOURCES, STATUS_TONES, SourceId, T } from "./tokens"

const PROVIDER_IDS = Object.keys(SOURCES) as SourceId[]
const SEARCHABLE_PROVIDER_IDS: SourceId[] = ["kite", "tele2"]
const STALE_TIME_MS = 5 * 60 * 1000
const DETAIL_STALE_TIME_MS = 30 * 1000
const JOB_POLL_MS = 5000
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 25
const GRID_COLS_DEFAULT = "4px minmax(170px,1.15fr) minmax(120px,.75fr) minmax(130px,.8fr) minmax(150px,1fr) 120px 170px 120px 100px"
const GRID_COLS_MOABITS = "4px minmax(170px,1.15fr) 120px minmax(110px,.7fr) minmax(110px,.7fr) minmax(120px,.8fr) minmax(120px,.8fr) minmax(110px,.7fr) minmax(120px,.8fr) 100px"
const cellH: CSSProperties = { padding: "9px 12px" }
const cell: CSSProperties = { padding: "9px 12px", minWidth: 0 }

type SourceFilter = SourceId | "all"
type StatusFilter = string | "all"
type QueryScope = SourceId | "global"
type ViewScope = "company" | "global"
type NativeStatusSelections = Partial<Record<SourceId, Set<string>>>

interface QueryRequest {
  provider?: SourceId
  status?: string
  statuses?: string
  iccid?: string
  key: string
  failureProvider: string
}

function isSourceId(value: string | undefined): value is SourceId {
  return !!value && value in SOURCES
}

function normalizeStatusValue(value: string | null | undefined) {
  return (value ?? "").trim()
}

function statusKey(value: string | null | undefined) {
  return normalizeStatusValue(value).toLowerCase()
}

function rowNativeStatus(row: SubscriptionRow) {
  return normalizeStatusValue(row.status || row.nativeStatus)
}

function isKnownNativeStatus(provider: SourceId, value: string | null | undefined) {
  const key = statusKey(value)
  return Boolean(key && PROVIDER_NATIVE_STATUSES[provider].some((s) => statusKey(s.value) === key))
}

function sanitizeProviderIds(providers?: SourceId[] | null): SourceId[] {
  const unique = new Set<SourceId>()
  for (const provider of providers ?? PROVIDER_IDS) {
    if (provider in SOURCES) unique.add(provider)
  }
  return PROVIDER_IDS.filter((provider) => unique.has(provider))
}

function parseStatusSelections(value: string | undefined, providerIds: readonly SourceId[] = PROVIDER_IDS): NativeStatusSelections {
  const active = new Set(providerIds)
  const selections: NativeStatusSelections = {}
  for (const raw of (value ?? "").split(",")) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const separator = trimmed.indexOf(":")
    if (separator <= 0) continue
    const provider = trimmed.slice(0, separator)
    const status = trimmed.slice(separator + 1)
    if (!isSourceId(provider) || !active.has(provider) || !isKnownNativeStatus(provider, status)) continue
    selections[provider] = selections[provider] ?? new Set<string>()
    selections[provider]?.add(PROVIDER_NATIVE_STATUSES[provider].find((s) => statusKey(s.value) === statusKey(status))?.value ?? status)
  }
  return selections
}

function serializeStatusSelections(selections: NativeStatusSelections, providerIds: readonly SourceId[] = PROVIDER_IDS) {
  const parts: string[] = []
  for (const provider of providerIds) {
    for (const status of selections[provider] ?? []) {
      parts.push(`${provider}:${status}`)
    }
  }
  return parts.length ? parts.join(",") : null
}

function hasStatusSelections(selections: NativeStatusSelections, providerIds: readonly SourceId[] = PROVIDER_IDS) {
  return providerIds.some((provider) => (selections[provider]?.size ?? 0) > 0)
}

function toggleStatusSelection(selections: NativeStatusSelections, provider: SourceId, status: string): NativeStatusSelections {
  const next: NativeStatusSelections = { ...selections }
  const providerStatuses = new Set(next[provider] ?? [])
  if (providerStatuses.has(status)) providerStatuses.delete(status)
  else providerStatuses.add(status)

  if (providerStatuses.size) next[provider] = providerStatuses
  else delete next[provider]
  return next
}

function countStatusSelections(selections: NativeStatusSelections, providerIds: readonly SourceId[] = PROVIDER_IDS) {
  return providerIds.reduce((total, provider) => total + (selections[provider]?.size ?? 0), 0)
}

function pageSizeFrom(value: string | null | undefined) {
  const parsed = positiveInt(value, DEFAULT_PAGE_SIZE)
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE
}

function parseCursorStack(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function setParam(params: URLSearchParams, key: string, value: string | null | undefined) {
  if (value) params.set(key, value)
  else params.delete(key)
}

function dropPaginationParams(params: URLSearchParams) {
  params.delete("cursor")
  params.delete("cursor_stack")
  params.delete("page")
}

function queryRequestsFor(
  selectedProvider: SourceId | undefined,
  query: string,
  selectedStatus: string | undefined,
  statusSelections: NativeStatusSelections,
  providerIds: readonly SourceId[],
): QueryRequest[] {
  // Multi-ICCID takes precedence over other filters. Keep it as one logical
  // request so the server action can use POST /sims/details instead of a
  // client-side fan-out.
  const iccids = parseIccidList(query)
  if (iccids.length > 1) {
    const scope = selectedProvider ?? "global"
    return [{
      provider: selectedProvider,
      iccid: iccids.slice(0, MAX_ICCID_BATCH).join(","),
      key: `iccids:${scope}:${iccids.slice(0, MAX_ICCID_BATCH).sort().join(",")}`,
      failureProvider: scope,
    }]
  }

  if (selectedProvider) {
    const serverStatus = selectedStatus
    return [{ provider: selectedProvider, status: serverStatus, key: `${selectedProvider}:${serverStatus ?? "all"}`, failureProvider: selectedProvider }]
  }

  if (hasStatusSelections(statusSelections, providerIds)) {
    const statuses = serializeStatusSelections(statusSelections, providerIds)
    return statuses ? [{ statuses, key: `search:${statuses}`, failureProvider: "global" }] : []
  }

  return scopesForQuery(selectedProvider, query, providerIds).map((scope) => ({
    provider: scope === "global" ? undefined : scope,
    key: scope,
    failureProvider: scope,
  }))
}

function isExactIccidQuery(value: string) {
  return isIccid(value)
}

function scopesForQuery(selectedProvider: SourceId | undefined, query: string, providerIds: readonly SourceId[]): QueryScope[] {
  if (selectedProvider) return [selectedProvider]
  if (!query.trim() || isExactIccidQuery(query)) return ["global"]
  return query.trim() ? SEARCHABLE_PROVIDER_IDS.filter((provider) => providerIds.includes(provider)) : [...providerIds]
}

function mergeRow(existing: SubscriptionRow | undefined, incoming: SubscriptionRow) {
  if (!existing) return incoming
  return {
    ...existing,
    ...incoming,
    msisdn: incoming.msisdn ?? existing.msisdn,
    imsi: incoming.imsi ?? existing.imsi,
    nativeStatus: incoming.nativeStatus || existing.nativeStatus,
    status: incoming.status || existing.status,
    statusLabel: incoming.statusLabel || existing.statusLabel,
    statusGroup: incoming.statusGroup ?? existing.statusGroup,
    statusGroupLabel: incoming.statusGroupLabel ?? existing.statusGroupLabel,
    customerName: incoming.customerName ?? existing.customerName,
    customerScope: incoming.customerScope ?? existing.customerScope,
    planName: incoming.planName ?? existing.planName,
    planCode: incoming.planCode ?? existing.planCode,
    planId: incoming.planId ?? existing.planId,
    planDisplay: incoming.planDisplay !== "—" ? incoming.planDisplay : existing.planDisplay,
    activatedAt: incoming.activatedAt ?? existing.activatedAt,
    updatedAt: incoming.updatedAt ?? existing.updatedAt,
  }
}

function mergeRowsIntoResult(cached: LoadSubscriptionsData, incomingRows: SubscriptionRow[]): LoadSubscriptionsData {
  const nextRows = [...cached.rows]
  const rowIndexes = new Map(nextRows.map((row, index) => [rowKey(row), index]))

  for (const incoming of incomingRows) {
    const key = rowKey(incoming)
    const index = rowIndexes.get(key)
    const merged = mergeRow(index == null ? undefined : nextRows[index], incoming)

    if (index != null) {
      nextRows[index] = merged
    } else {
      nextRows.unshift(merged)
      rowIndexes.forEach((value, existingKey) => rowIndexes.set(existingKey, value + 1))
      rowIndexes.set(key, 0)
    }
  }

  return {
    ...cached,
    rows: nextRows,
    pagination: {
      ...cached.pagination,
      total: cached.pagination.total == null ? cached.pagination.total : Math.max(cached.pagination.total, nextRows.length),
    },
  }
}

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
  if (stateOverride === "loading") return <LoadingState filters={filters} />
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
  const queryClient = useQueryClient()
  const viewScope: ViewScope = isAdmin && filters?.scope === "global" ? "global" : "company"
  const activeProviderIds = useMemo(() => viewScope === "global" ? PROVIDER_IDS : sanitizeProviderIds(activeProviders), [activeProviders, viewScope])
  const q = filters?.q ?? ""
  const cursor = filters?.cursor ?? ""
  const pageSize = pageSizeFrom(filters?.size)
  const selectedProvider = isSourceId(filters?.provider) && activeProviderIds.includes(filters.provider) ? filters.provider : undefined
  const selectedStatus =
    selectedProvider && isKnownNativeStatus(selectedProvider, filters?.status)
      ? normalizeStatusValue(filters?.status)
      : undefined
  const statusSelections = useMemo(
    () => (selectedProvider ? {} : parseStatusSelections(filters?.statuses, activeProviderIds)),
    [activeProviderIds, filters?.statuses, selectedProvider],
  )
  const queryRequests = useMemo(
    () => queryRequestsFor(selectedProvider, q, selectedStatus, statusSelections, activeProviderIds),
    [activeProviderIds, q, selectedProvider, selectedStatus, statusSelections],
  )
  const listFilters: LoadSubscriptionsData["filters"] = {
    scope: viewScope,
    provider: selectedProvider,
    status: selectedStatus,
    statuses: selectedProvider ? undefined : serializeStatusSelections(statusSelections, activeProviderIds) ?? undefined,
    cursor,
    q,
  }

  const results = useQueries({
    queries: queryRequests.map((request) => ({
      queryKey: ["subscriptions", viewScope, request.provider ?? "global", request.status ?? "", request.statuses ?? "", request.iccid ?? q, request.iccid ? "" : cursor, pageSize] as const,
      queryFn: async () => {
        const result = await loadSubscriptions({ scope: viewScope, provider: request.provider, status: request.status, statuses: request.statuses, q: request.iccid ?? filters?.q, cursor: request.iccid ? undefined : filters?.cursor, limit: pageSize })
        if (!result.ok && result.kind === "error") throw new Error(result.error)
        return result
      },
      retry: false,
      staleTime: STALE_TIME_MS,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const allFailed = results.every((r) => r.isError || (r.data && !r.data.ok))
  const { allRows, failedProviders, providerStatuses, hasPartial, nextCursor, resultTotal, initialDetailLookup } = useMemo(() => {
    const rows: SubscriptionRow[] = []
    const seenRows = new Set<string>()
    const failed: FailedProvider[] = []
    const statuses: LoadSubscriptionsData["pagination"]["providerStatuses"] = []
    let partial = false
    const canUseCursor = queryRequests.length === 1
    let okCount = 0
    let singleNextCursor: string | null = null
    let singleTotal: number | null = null
    let detailLookup: LoadSubscriptionsData["detailLookup"] | undefined

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.data?.ok) {
        okCount += 1
        if (okCount === 1) {
          singleNextCursor = r.data.data.pagination.nextCursor
          singleTotal = r.data.data.pagination.total
          detailLookup = r.data.data.detailLookup
        } else {
          singleNextCursor = null
          singleTotal = null
          detailLookup = undefined
        }
        for (const row of r.data.data.rows ?? []) {
          const key = `${row.provider}:${row.iccid}`
          if (seenRows.has(key)) continue
          rows.push(row)
          seenRows.add(key)
        }
        failed.push(...(r.data.data.pagination.failedProviders ?? []))
        statuses.push(...(r.data.data.pagination.providerStatuses ?? []))
        if (r.data.data.pagination.partial) partial = true
      } else if (r.isError || (r.data && !r.data.ok)) {
        failed.push({
          provider: queryRequests[i]?.failureProvider ?? "global",
          code: "provider.unavailable",
          title: r.isError ? (r.error instanceof Error ? r.error.message : "No se pudo consultar") : "No se pudo consultar",
        })
      }
    }

    return {
      allRows: rows,
      failedProviders: failed,
      providerStatuses: statuses,
      hasPartial: partial,
      nextCursor: canUseCursor ? singleNextCursor : null,
      resultTotal: canUseCursor ? singleTotal : null,
      initialDetailLookup: canUseCursor ? detailLookup : undefined,
    }
  }, [queryRequests, results])

  useEffect(() => {
    if (!q.trim() || allRows.length === 0) return

    for (const provider of activeProviderIds) {
      const providerRows = allRows.filter((row) => row.provider === provider)
      if (providerRows.length === 0) continue

      queryClient.setQueryData<LoadSubscriptionsResult>(["subscriptions", viewScope, provider, "", "", ""], (cached) => {
        if (!cached?.ok) return cached
        return {
          ...cached,
          data: mergeRowsIntoResult(cached.data, providerRows),
        }
      })
    }
  }, [activeProviderIds, allRows, q, queryClient, viewScope])

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

  if (isLoading) return <LoadingState filters={filters} />

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

function ListEmptyShell({ query }: { query?: string }) {
  return (
    <div
      style={{
        background: T.pageBg,
        fontFamily: T.fontBody,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <style>{`@keyframes bismark-inline-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title }}>Suscripciones</h1>
      </div>
      <EmptyState query={query || "tus filtros"} />
    </div>
  )
}

function NoActiveProvidersState() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="rounded-lg border border-border bg-[#F5FAFA] p-6 shadow-sm shadow-header-top/5">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Sin proveedores activos</p>
        <h1 className="mt-2 text-2xl font-bold text-title">Configura credenciales para consultar SIMs</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Esta empresa no tiene credenciales activas de Kite, Tele2 o Moabits. Cuando haya una credencial activa, apareceran sus filtros y resultados.
        </p>
        <div className="mt-5">
          <Link href="/dashboard/credentials" className="rounded bg-header-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Ir a credenciales
          </Link>
        </div>
      </div>
    </div>
  )
}

function secondary(value: string | null | undefined) {
  return value && value.trim() ? value : "—"
}

function sortedUnique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort()
}

function rowKey(row: SubscriptionRow) {
  return `${row.provider}:${row.iccid}`
}

function mergeDetailRows(rows: SubscriptionRow[], details: Record<string, SimDetailsResult> | undefined) {
  if (!details) return rows
  return rows.map((row) => {
    const detail = details[row.iccid]
    if (detail?.status === "ok" && detail.data) return mergeRow(row, detail.data ? toDetailRow(detail.data) : row)
    return row
  })
}

function toDetailRow(data: NonNullable<SimDetailsResult["data"]>): SubscriptionRow {
  const n = data.normalized
  const providerStatus = data.status?.trim() || "UNKNOWN"
  const planName = stringOrNull(n.plan.name)
  const planCode = stringOrNull(n.plan.code)
  const planId = stringOrNull(n.plan.id == null ? null : String(n.plan.id))
  const pf = data.provider_fields ?? {}
  const pfString = (key: string): string | null => {
    const raw = pf[key]
    if (raw == null) return null
    const text = String(raw).trim()
    return text || null
  }
  return {
    iccid: data.iccid,
    provider: data.provider,
    msisdn: data.msisdn,
    imsi: data.imsi,
    status: providerStatus,
    nativeStatus: providerStatus,
    statusLabel: stringOrNull(n.status.label) ?? providerStatus,
    statusGroup: stringOrNull(n.status.group),
    statusGroupLabel: stringOrNull(n.status.group_label),
    customerName: n.customer.name,
    customerScope: n.customer.company_code ?? n.customer.account_id ?? null,
    planName,
    planCode,
    planId,
    planDisplay: planName ?? planCode ?? planId ?? "—",
    activatedAt: data.activated_at,
    updatedAt: data.updated_at,
    imei: n.identity.imei,
    operator: n.network.operator,
    country: n.network.country,
    ratType: n.network.rat_type,
    ipAddress: n.network.ip_address,
    dataService: n.services.data_service,
    smsService: n.services.sms_service,
    lastLuAt: n.network.last_lu_at,
    lastCdrAt: n.network.last_cdr_at,
    firstCdrMonth: pfString("firstcdrmonth"),
    connectivityImsi: pfString("connectivity_imsi_raw"),
    communicationPlan: stringOrNull(n.plan.communication_plan) ?? pfString("communication_plan"),
    autorenewal: pfString("autorenewal"),
    alias: stringOrNull(n.identity.alias) ?? pfString("alias"),
    commercialGroup: pfString("commercial_group"),
    supervisionGroup: pfString("supervision_group"),
    servicePack: pfString("service_pack") ?? pfString("service_pack_id"),
    accountId: stringOrNull(n.customer.account_id) ?? pfString("account_id"),
    endConsumerId: pfString("end_consumer_id") ?? stringOrNull(n.customer.id) ?? null,
    deviceId: stringOrNull(n.hardware.device_id) ?? pfString("device_id"),
    modemId: stringOrNull(n.hardware.modem_id) ?? pfString("modem_id"),
    eid: stringOrNull(n.identity.eid) ?? pfString("eid"),
    euiccid: stringOrNull(n.identity.euiccid) ?? pfString("euiccid"),
    simProfileId: stringOrNull(n.identity.sim_profile_id) ?? pfString("sim_profile_id"),
    fixedIpAddress: stringOrNull(n.network.fixed_ip_address) ?? pfString("fixed_ip_address"),
    productCode: planCode ?? pfString("product_code"),
    companyCode: stringOrNull(n.customer.company_code) ?? pfString("company_code"),
    dataLimitMb: pfString("data_limit_mb"),
    smsLimit: pfString("sms_limit"),
    accountCustoms: Array.from({ length: 10 }, (_, index) => pfString(`account_custom_${index + 1}`)),
    operatorCustoms: Array.from({ length: 5 }, (_, index) => pfString(`operator_custom_${index + 1}`)),
    customerCustoms: Array.from({ length: 5 }, (_, index) => pfString(`customer_custom_${index + 1}`)),
    customField1: stringOrNull(n.custom_fields.custom_field_1 == null ? null : String(n.custom_fields.custom_field_1)) ?? pfString("custom_field_1"),
    customField2: stringOrNull(n.custom_fields.custom_field_2 == null ? null : String(n.custom_fields.custom_field_2)) ?? pfString("custom_field_2"),
    customField3: stringOrNull(n.custom_fields.custom_field_3 == null ? null : String(n.custom_fields.custom_field_3)) ?? pfString("custom_field_3"),
    customField4: stringOrNull(n.custom_fields.custom_field_4 == null ? null : String(n.custom_fields.custom_field_4)) ?? pfString("custom_field_4"),
  }
}

function stringOrNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || null
}

function tristateTextMatches(value: string | null, expected: "on" | "off") {
  const normalized = (value ?? "").trim().toLowerCase()
  if (!normalized) return false
  const truthy = new Set(["true", "1", "yes", "enabled", "active", "on", "si", "sí"])
  const falsy = new Set(["false", "0", "no", "disabled", "inactive", "off"])
  if (expected === "on") return truthy.has(normalized)
  return falsy.has(normalized)
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
  const activeProviderIds = useMemo(() => sanitizeProviderIds(activeProviders), [activeProviders])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const filterQ = filters?.q ?? ""
  const filterStatuses = filters.statuses
  const filterStatus =
    initialSource !== "all" && activeProviderIds.includes(initialSource) && isKnownNativeStatus(initialSource, filters?.status)
      ? normalizeStatusValue(filters?.status)
      : "all"
  const initialStatusSelections = useMemo(
    () => (initialSource === "all" ? parseStatusSelections(filterStatuses, activeProviderIds) : {}),
    [activeProviderIds, filterStatuses, initialSource],
  )
  const [draftQ, setDraftQ] = useState(filterQ)
  const [q, setQ] = useState(filterQ)
  const [activeSrc, setActiveSrc] = useState<SourceFilter>(initialSource)
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(filterStatus)
  const [statusSelections, setStatusSelections] = useState<NativeStatusSelections>(initialStatusSelections)
  const iccidList = useMemo(() => parseIccidList(draftQ), [draftQ])
  const isMultiIccid = iccidList.length > 1

  function commitSearch() {
    setQ(draftQ.trim())
  }

  function clearSearch() {
    setDraftQ("")
    setQ("")
  }

  const [hovered, setHovered] = useState<string | null>(null)
  const [openRecord, setOpenRecord] = useState<SubscriptionRow | null>(null)
  const [advOpen, setAdvOpen] = useState(false)
  const [advSrcs, setAdvSrcs] = useState<Set<SourceId> | null>(null)
  const [advPlan, setAdvPlan] = useState("")
  const [advClient, setAdvClient] = useState("")
  const [advImei, setAdvImei] = useState("")
  const [advOperator, setAdvOperator] = useState("")
  const [advServiceData, setAdvServiceData] = useState<"any" | "on" | "off">("any")
  const [advServiceSms, setAdvServiceSms] = useState<"any" | "on" | "off">("any")
  const [advStaleLuOnly, setAdvStaleLuOnly] = useState(false)
  const [kiteAlias, setKiteAlias] = useState("")
  const [kiteCommercialGroup, setKiteCommercialGroup] = useState("")
  const [kiteSupervisionGroup, setKiteSupervisionGroup] = useState("")
  const [kiteServicePack, setKiteServicePack] = useState("")
  const [kiteCustomFields, setKiteCustomFields] = useState(["", "", "", ""])
  const [tele2RatePlan, setTele2RatePlan] = useState("")
  const [tele2CommunicationPlan, setTele2CommunicationPlan] = useState("")
  const [tele2AccountId, setTele2AccountId] = useState("")
  const [tele2AccountCustoms, setTele2AccountCustoms] = useState(Array.from({ length: 10 }, () => ""))
  const [tele2OperatorCustoms, setTele2OperatorCustoms] = useState(Array.from({ length: 5 }, () => ""))
  const [tele2CustomerCustoms, setTele2CustomerCustoms] = useState(Array.from({ length: 5 }, () => ""))
  const [moabitsProductName, setMoabitsProductName] = useState("")
  const [moabitsProductCode, setMoabitsProductCode] = useState("")
  const [moabitsCompanyCode, setMoabitsCompanyCode] = useState("")
  const [moabitsAutorenewal, setMoabitsAutorenewal] = useState<"any" | "on" | "off">("any")
  const [moabitsDataLimitMb, setMoabitsDataLimitMb] = useState("")
  const [moabitsSmsLimit, setMoabitsSmsLimit] = useState("")
  const [moabitsCountry, setMoabitsCountry] = useState("")
  const [moabitsRatType, setMoabitsRatType] = useState("")
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isDataRefreshing, setIsDataRefreshing] = useState(false)
  const currentPageSize = pageSizeFrom(searchParams.get("size"))
  const hasServerAdvancedFilters = Boolean(
    advImei.trim() ||
    advOperator.trim() ||
    advServiceData !== "any" ||
    advServiceSms !== "any" ||
    advStaleLuOnly ||
    kiteAlias.trim() ||
    kiteCommercialGroup.trim() ||
    kiteSupervisionGroup.trim() ||
    kiteServicePack.trim() ||
    kiteCustomFields.some((value) => value.trim()) ||
    tele2RatePlan.trim() ||
    tele2CommunicationPlan.trim() ||
    tele2AccountId.trim() ||
    tele2AccountCustoms.some((value) => value.trim()) ||
    tele2OperatorCustoms.some((value) => value.trim()) ||
    tele2CustomerCustoms.some((value) => value.trim()) ||
    moabitsProductName.trim() ||
    moabitsProductCode.trim() ||
    moabitsCompanyCode.trim() ||
    moabitsAutorenewal !== "any" ||
    moabitsDataLimitMb.trim() ||
    moabitsSmsLimit.trim() ||
    moabitsCountry.trim() ||
    moabitsRatType.trim()
  )

  const serverFilteredQuery = useQuery({
    queryKey: [
      "subscriptions-advanced",
      viewScope,
      activeSrc,
      activeStatus,
      serializeStatusSelections(statusSelections, activeProviderIds),
      q,
      currentPageSize,
      advImei.trim(),
      advOperator.trim(),
      advServiceData,
      advServiceSms,
      advStaleLuOnly,
      kiteAlias.trim(),
      kiteCommercialGroup.trim(),
      kiteSupervisionGroup.trim(),
      kiteServicePack.trim(),
      kiteCustomFields,
      tele2RatePlan.trim(),
      tele2CommunicationPlan.trim(),
      tele2AccountId.trim(),
      tele2AccountCustoms,
      tele2OperatorCustoms,
      tele2CustomerCustoms,
      moabitsProductName.trim(),
      moabitsProductCode.trim(),
      moabitsCompanyCode.trim(),
      moabitsAutorenewal,
      moabitsDataLimitMb.trim(),
      moabitsSmsLimit.trim(),
      moabitsCountry.trim(),
      moabitsRatType.trim(),
    ] as const,
    queryFn: async () => {
      const result = await loadSubscriptions({
        scope: viewScope,
        provider: activeSrc === "all" ? undefined : activeSrc,
        status: activeSrc !== "all" && activeStatus !== "all" ? activeStatus : undefined,
        statuses: activeSrc === "all" ? serializeStatusSelections(statusSelections, activeProviderIds) ?? undefined : undefined,
        q,
        limit: currentPageSize,
        imei: advImei,
        operator: advOperator,
        dataService: advServiceData,
        smsService: advServiceSms,
        staleLuOnly: advStaleLuOnly,
        kiteAlias,
        kiteCommercialGroup,
        kiteSupervisionGroup,
        kiteServicePack,
        kiteCustomFields,
        tele2RatePlan,
        tele2CommunicationPlan,
        tele2AccountId,
        tele2AccountCustoms,
        tele2OperatorCustoms,
        tele2CustomerCustoms,
        moabitsProductName,
        moabitsProductCode,
        moabitsCompanyCode,
        moabitsAutorenewal,
        moabitsDataLimitMb,
        moabitsSmsLimit,
        moabitsCountry,
        moabitsRatType,
      })
      if (!result.ok) throw new Error(result.kind === "error" ? result.error : "No se pudo cargar la lista filtrada")
      return result.data
    },
    enabled: hasServerAdvancedFilters,
    retry: false,
    staleTime: STALE_TIME_MS,
  })
  const listedRows = hasServerAdvancedFilters && serverFilteredQuery.data ? serverFilteredQuery.data.rows : initialRows

  const detailProviders = useMemo(() => {
    if (activeSrc !== "all") return [activeSrc]
    return undefined
  }, [activeSrc])
  const detailIccids = useMemo(() => sortedUnique(listedRows.map((row) => row.iccid)).slice(0, MAX_ICCID_BATCH), [listedRows])
  const detailProviderKey = useMemo(() => sortedUnique(detailProviders ?? []), [detailProviders])
  const detailsQuery = useQuery({
    queryKey: ["sim-details", detailIccids, detailProviderKey] as const,
    queryFn: async () => {
      const result = await loadSimDetails({
        iccids: detailIccids,
        providers: detailProviders,
      })
      if (!result.ok) throw new Error(result.error.detail || result.error.title || "No se pudieron cargar los detalles")
      return result.data
    },
    enabled: viewScope === "company" && detailIccids.length > 0,
    initialData: initialDetailLookup,
    retry: false,
    staleTime: DETAIL_STALE_TIME_MS,
  })
  const syncStatusQuery = useQuery({
    queryKey: ["sync-status"] as const,
    queryFn: async () => {
      const result = await loadSyncStatus()
      if (!result.ok) throw new Error(result.error.detail || result.error.title || "No se pudo consultar la sincronización")
      return result.data
    },
    refetchInterval: JOB_POLL_MS,
    staleTime: 0,
    retry: false,
    enabled: viewScope === "company",
  })
  const triggerSyncMutation = useMutation({
    mutationFn: async (provider: SourceId) => triggerRoutingSync(provider),
    onSuccess: (result) => {
      if (result.ok) setActiveJobId(result.data.job_id)
      queryClient.invalidateQueries({ queryKey: ["sync-status"] })
    },
  })
  const activeJobQuery = useQuery({
    queryKey: ["job", activeJobId] as const,
    queryFn: async () => {
      if (!activeJobId) throw new Error("No job id")
      const result = await loadJob(activeJobId)
      if (!result.ok) throw new Error(result.error.detail || result.error.title || "No se pudo consultar el job")
      return result.data
    },
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === "done" || status === "failed" ? false : JOB_POLL_MS
    },
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    if (!advOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [advOpen])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    const currentFilters = new URLSearchParams(searchParams)
    dropPaginationParams(currentFilters)

    setParam(params, "provider", activeSrc === "all" ? null : activeSrc)
    setParam(params, "status", activeSrc !== "all" && activeStatus !== "all" ? activeStatus : null)
    setParam(params, "statuses", activeSrc === "all" ? serializeStatusSelections(statusSelections, activeProviderIds) : null)
    setParam(params, "q", q.trim() || null)
    setParam(params, "scope", viewScope === "global" ? "global" : null)

    const nextFilters = new URLSearchParams(params)
    dropPaginationParams(nextFilters)
    if (nextFilters.toString() !== currentFilters.toString()) dropPaginationParams(params)

    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false })
  }, [activeProviderIds, activeSrc, activeStatus, pathname, q, router, searchParams, statusSelections, viewScope])

  const enrichedInitialRows = useMemo(
    () => mergeDetailRows(listedRows, detailsQuery.data?.results),
    [detailsQuery.data?.results, listedRows],
  )

  useEffect(() => {
    const job = activeJobQuery.data
    if (!job || (job.status !== "done" && job.status !== "failed")) return
    queryClient.invalidateQueries({ queryKey: ["sync-status"] })
    if (job.status === "done") {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      queryClient.invalidateQueries({ queryKey: ["sim-details"] })
    }
  }, [activeJobQuery.data, queryClient])

  const rows = useMemo(
    () =>
      enrichedInitialRows.filter((r) => {
        if (activeSrc !== "all" && r.provider !== activeSrc) return false
        if (activeSrc !== "all" && activeStatus !== "all" && statusKey(rowNativeStatus(r)) !== statusKey(activeStatus)) return false
        if (activeSrc === "all" && hasStatusSelections(statusSelections, activeProviderIds)) {
          const providerStatuses = statusSelections[r.provider]
          if (!providerStatuses || !Array.from(providerStatuses).some((status) => statusKey(status) === statusKey(rowNativeStatus(r)))) return false
        }
        if (advSrcs && advSrcs.size > 0 && !advSrcs.has(r.provider)) return false
        const planQ = advPlan.trim().toLowerCase()
        if (planQ && !`${r.planName ?? ""} ${r.planCode ?? ""} ${r.planId ?? ""}`.toLowerCase().includes(planQ)) return false
        const clientQ = advClient.trim().toLowerCase()
        if (clientQ && !`${r.customerName ?? ""} ${r.customerScope ?? ""}`.toLowerCase().includes(clientQ)) return false
        const imeiQ = advImei.trim().toLowerCase()
        if (imeiQ && !(r.imei ?? "").toLowerCase().includes(imeiQ)) return false
        if (activeSrc === "kite") {
          const customValues = [r.customField1, r.customField2, r.customField3, r.customField4]
          if (kiteCustomFields.some((value, index) => value.trim() && !(customValues[index] ?? "").toLowerCase().includes(value.trim().toLowerCase()))) return false
          if (kiteAlias.trim() && !(r.alias ?? "").toLowerCase().includes(kiteAlias.trim().toLowerCase())) return false
          if (kiteCommercialGroup.trim() && !(r.commercialGroup ?? "").toLowerCase().includes(kiteCommercialGroup.trim().toLowerCase())) return false
          if (kiteSupervisionGroup.trim() && !(r.supervisionGroup ?? "").toLowerCase().includes(kiteSupervisionGroup.trim().toLowerCase())) return false
          if (kiteServicePack.trim() && !(r.servicePack ?? "").toLowerCase().includes(kiteServicePack.trim().toLowerCase())) return false
        }
        if (activeSrc === "tele2") {
          const rateQ = tele2RatePlan.trim().toLowerCase()
          if (rateQ && !(r.planName ?? "").toLowerCase().includes(rateQ)) return false
          const communicationQ = tele2CommunicationPlan.trim().toLowerCase()
          if (communicationQ && !(r.communicationPlan ?? "").toLowerCase().includes(communicationQ)) return false
          if (tele2AccountId.trim() && !(r.accountId ?? "").toLowerCase().includes(tele2AccountId.trim().toLowerCase())) return false
          if (tele2AccountCustoms.some((value, index) => value.trim() && !(r.accountCustoms[index] ?? "").toLowerCase().includes(value.trim().toLowerCase()))) return false
          if (tele2OperatorCustoms.some((value, index) => value.trim() && !(r.operatorCustoms[index] ?? "").toLowerCase().includes(value.trim().toLowerCase()))) return false
          if (tele2CustomerCustoms.some((value, index) => value.trim() && !(r.customerCustoms[index] ?? "").toLowerCase().includes(value.trim().toLowerCase()))) return false
        }
        if (activeSrc === "moabits") {
          const productQ = moabitsProductName.trim().toLowerCase()
          if (productQ && !(r.planName ?? "").toLowerCase().includes(productQ)) return false
          if (moabitsProductCode.trim() && !(r.productCode ?? "").toLowerCase().includes(moabitsProductCode.trim().toLowerCase())) return false
          if (moabitsCompanyCode.trim() && !(r.companyCode ?? "").toLowerCase().includes(moabitsCompanyCode.trim().toLowerCase())) return false
          if (moabitsAutorenewal !== "any" && !tristateTextMatches(r.autorenewal, moabitsAutorenewal)) return false
          if (moabitsDataLimitMb.trim() && !(r.dataLimitMb ?? "").toLowerCase().includes(moabitsDataLimitMb.trim().toLowerCase())) return false
          if (moabitsSmsLimit.trim() && !(r.smsLimit ?? "").toLowerCase().includes(moabitsSmsLimit.trim().toLowerCase())) return false
          if (moabitsCountry.trim() && !(r.country ?? "").toLowerCase().includes(moabitsCountry.trim().toLowerCase())) return false
          if (moabitsRatType.trim() && !(r.ratType ?? "").toLowerCase().includes(moabitsRatType.trim().toLowerCase())) return false
        }
        if (isMultiIccid) return iccidList.includes(r.iccid)
        if (!draftQ.trim()) return true
        const haystack = [r.iccid, r.msisdn, r.imsi, r.status, r.statusLabel, r.provider]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(draftQ.trim().toLowerCase())
      }),
    [activeProviderIds, activeSrc, activeStatus, advClient, advImei, advPlan, advSrcs, draftQ, enrichedInitialRows, iccidList, isMultiIccid, kiteAlias, kiteCommercialGroup, kiteCustomFields, kiteServicePack, kiteSupervisionGroup, moabitsAutorenewal, moabitsCompanyCode, moabitsCountry, moabitsDataLimitMb, moabitsProductCode, moabitsProductName, moabitsRatType, moabitsSmsLimit, statusSelections, tele2AccountCustoms, tele2AccountId, tele2CommunicationPlan, tele2CustomerCustoms, tele2OperatorCustoms, tele2RatePlan],
  )

  const statusFilterCount = activeSrc === "all" ? countStatusSelections(statusSelections, activeProviderIds) : activeStatus === "all" ? 0 : 1
  const advCount =
    (advSrcs && advSrcs.size > 0 ? 1 : 0) +
    (advPlan.trim() ? 1 : 0) +
    (advClient.trim() ? 1 : 0) +
    (advImei.trim() ? 1 : 0) +
    (advOperator.trim() ? 1 : 0) +
    (advServiceData !== "any" ? 1 : 0) +
    (advServiceSms !== "any" ? 1 : 0) +
    (advStaleLuOnly ? 1 : 0) +
    (activeSrc === "kite" && kiteAlias.trim() ? 1 : 0) +
    (activeSrc === "kite" && kiteCommercialGroup.trim() ? 1 : 0) +
    (activeSrc === "kite" && kiteSupervisionGroup.trim() ? 1 : 0) +
    (activeSrc === "kite" && kiteServicePack.trim() ? 1 : 0) +
    (activeSrc === "kite" ? kiteCustomFields.filter((value) => value.trim()).length : 0) +
    (activeSrc === "tele2" && tele2RatePlan.trim() ? 1 : 0) +
    (activeSrc === "tele2" && tele2CommunicationPlan.trim() ? 1 : 0) +
    (activeSrc === "tele2" && tele2AccountId.trim() ? 1 : 0) +
    (activeSrc === "tele2" ? tele2AccountCustoms.filter((value) => value.trim()).length : 0) +
    (activeSrc === "tele2" ? tele2OperatorCustoms.filter((value) => value.trim()).length : 0) +
    (activeSrc === "tele2" ? tele2CustomerCustoms.filter((value) => value.trim()).length : 0) +
    (activeSrc === "moabits" && moabitsProductName.trim() ? 1 : 0) +
    (activeSrc === "moabits" && moabitsProductCode.trim() ? 1 : 0) +
    (activeSrc === "moabits" && moabitsCompanyCode.trim() ? 1 : 0) +
    (activeSrc === "moabits" && moabitsAutorenewal !== "any" ? 1 : 0) +
    (activeSrc === "moabits" && moabitsDataLimitMb.trim() ? 1 : 0) +
    (activeSrc === "moabits" && moabitsSmsLimit.trim() ? 1 : 0) +
    (activeSrc === "moabits" && moabitsCountry.trim() ? 1 : 0) +
    (activeSrc === "moabits" && moabitsRatType.trim() ? 1 : 0)
  // When the user clicks a source tab, activeSrc changes before the URL updates.
  // During that transition, pagination metadata (cursor, total) is still from the
  // previous query scope — using it would navigate with the wrong cursor. Suppress
  // it until the URL reflects the new source and the component remounts with
  // source-specific data.
  const isTransitioning = activeSrc !== initialSource
  const total = isTransitioning ? null : (pagination?.total ?? null)
  const effectiveNextCursor = isTransitioning ? null : (pagination?.nextCursor ?? null)
  const pageSize = currentPageSize
  const cursorStack = useMemo(() => parseCursorStack(searchParams.get("cursor_stack")), [searchParams])
  const page = positiveInt(searchParams.get("page"), filters.cursor ? cursorStack.length + 1 : 1)
  const failedProviders = pagination?.failedProviders ?? []
  const hasPartialProviders = Boolean(pagination?.partial && failedProviders.length)

  const sourceTabs = [
    { id: "all" as const, name: "Todas", color: T.headerBg },
    ...activeProviderIds.map((provider) => SOURCES[provider]).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
    })),
  ]

  const conicGradient =
    "conic-gradient(" +
    activeProviderIds.map((provider) => SOURCES[provider])
      .map((s, i, a) => `${s.color} ${(i * 100) / a.length}% ${((i + 1) * 100) / a.length}%`)
      .join(",") +
    ")"
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of enrichedInitialRows) {
      const key = `${row.provider}:${statusKey(rowNativeStatus(row))}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [enrichedInitialRows])
  const statusCount = (provider: SourceId, status: string) => statusCounts.get(`${provider}:${statusKey(status)}`) ?? 0

  const clearAdv = () => {
    setAdvSrcs(null)
    setAdvPlan("")
    setAdvClient("")
    setAdvImei("")
    setAdvOperator("")
    setAdvServiceData("any")
    setAdvServiceSms("any")
    setAdvStaleLuOnly(false)
    setKiteAlias("")
    setKiteCommercialGroup("")
    setKiteSupervisionGroup("")
    setKiteServicePack("")
    setKiteCustomFields(["", "", "", ""])
    setTele2RatePlan("")
    setTele2CommunicationPlan("")
    setTele2AccountId("")
    setTele2AccountCustoms(Array.from({ length: 10 }, () => ""))
    setTele2OperatorCustoms(Array.from({ length: 5 }, () => ""))
    setTele2CustomerCustoms(Array.from({ length: 5 }, () => ""))
    setMoabitsProductName("")
    setMoabitsProductCode("")
    setMoabitsCompanyCode("")
    setMoabitsAutorenewal("any")
    setMoabitsDataLimitMb("")
    setMoabitsSmsLimit("")
    setMoabitsCountry("")
    setMoabitsRatType("")
  }

  const allSelected = <V,>(set: Set<V> | null, options: readonly V[]) => !set || set.size === options.length
  const visibleSet = <V,>(set: Set<V> | null, options: readonly V[]) => set ?? new Set(options)
  const normalizeSet = <V,>(set: Set<V>, options: readonly V[]) => (set.size === 0 || set.size === options.length ? null : set)
  const toggleInSet = <V,>(set: Set<V> | null, key: V, options: readonly V[]): Set<V> | null => {
    const next = new Set(set ?? options)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return normalizeSet(next, options)
  }

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

  function triggerProviderSync(provider: SourceId) {
    if (!isAdmin) return
    triggerSyncMutation.mutate(provider)
  }

  function switchViewScope(nextScope: ViewScope) {
    if (!isAdmin || (nextScope === "company" && !hasCompanyScope)) return
    const params = new URLSearchParams(searchParams)
    setParam(params, "scope", nextScope === "global" ? "global" : null)
    dropPaginationParams(params)
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
  }

  if (isDataRefreshing) return <LoadingState filters={filters} />

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
              <div style={{ display: "inline-flex", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", background: T.pageBg }}>
                <button
                  type="button"
                  onClick={() => switchViewScope("company")}
                  disabled={!hasCompanyScope}
                  title={hasCompanyScope ? undefined : "Admin sin company asignada"}
                  style={{
                    border: "none",
                    borderRight: `1px solid ${T.border}`,
                    background: viewScope === "company" ? T.headerBg : "transparent",
                    color: viewScope === "company" ? "#fff" : hasCompanyScope ? T.text : T.muted,
                    cursor: hasCompanyScope ? "pointer" : "not-allowed",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: T.fontBody,
                    padding: "6px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Vista mi company
                </button>
                <button
                  type="button"
                  onClick={() => switchViewScope("global")}
                  style={{
                    border: "none",
                    background: viewScope === "global" ? T.headerBg : "transparent",
                    color: viewScope === "global" ? "#fff" : T.text,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: T.fontBody,
                    padding: "6px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Vista global
                </button>
              </div>
            )}
            <Btn variant="outline" size="sm" icon={<Icon.refresh size={13} />} onClick={handleSincronizar}>
              Sincronizar
            </Btn>
          </div>
        </div>

        <SyncStatusStrip
          activeProviders={activeProviderIds}
          isAdmin={isAdmin && viewScope === "company"}
          status={viewScope === "company" ? syncStatusQuery.data : undefined}
          statusError={viewScope === "company" && syncStatusQuery.isError ? (syncStatusQuery.error instanceof Error ? syncStatusQuery.error.message : "No se pudo consultar la sincronización") : null}
          activeJob={activeJobQuery.data}
          triggerResult={triggerSyncMutation.data}
          triggeringProvider={triggerSyncMutation.variables ?? null}
          isTriggering={triggerSyncMutation.isPending}
          onTrigger={triggerProviderSync}
        />

        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: T.pageBg,
              border: `1px solid ${draftQ.trim() !== q.trim() ? T.headerAccent : T.border}`,
              borderRadius: 6,
              padding: "9px 12px",
              transition: "border-color .15s",
            }}
          >
            <span style={{ color: T.muted, display: "inline-flex", flexShrink: 0 }}>
              <Icon.search size={15} />
            </span>
            <input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitSearch() }}
              placeholder="ICCID, MSISDN o IMSI — o pega varios ICCIDs separados por coma"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 13.5,
                fontFamily: T.fontBody,
                color: T.text,
                minWidth: 0,
              }}
            />
            {isMultiIccid && (
              <span style={{
                background: T.headerBg,
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                fontFamily: T.fontMono,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {iccidList.length} ICCIDs
              </span>
            )}
            {draftQ.trim() && (
              <button
                type="button"
                onClick={clearSearch}
                title="Limpiar busqueda"
                style={{
                  border: "none",
                  background: "transparent",
                  color: T.muted,
                  cursor: "pointer",
                  lineHeight: 0,
                  padding: 4,
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                <Icon.close size={14} />
              </button>
            )}
          </div>
          <Btn
            variant={draftQ.trim() !== q.trim() ? "primary" : "outline"}
            size="sm"
            icon={<Icon.search size={13} />}
            onClick={commitSearch}
          >
            Buscar
          </Btn>
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

        <div style={{ display: "flex", gap: 6, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
            Fuente
          </div>
          {sourceTabs.map((t) => {
            const active = activeSrc === t.id
            const isAll = t.id === "all"
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveSrc(t.id)
                  setActiveStatus("all")
                  setStatusSelections({})
                }}
                style={{
                  padding: "6px 11px 6px 9px",
                  background: active ? t.color : "#fff",
                  border: `1px solid ${active ? t.color : T.border}`,
                  borderRadius: 4,
                  color: active ? "#fff" : T.title,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: T.fontBody,
                  letterSpacing: -0.1,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: isAll ? "50%" : 3,
                    backgroundColor: active ? "rgba(255,255,255,.18)" : isAll ? "transparent" : t.color,
                    backgroundImage: !active && isAll ? conicGradient : undefined,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: T.fontMono,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {!isAll ? t.name[0].toUpperCase() : ""}
                </span>
                {t.name}
              </button>
            )
          })}
        </div>

        <KpiStrip
          rows={rows}
          scope={viewScope}
          activeSrc={activeSrc}
          imei={advImei}
          operator={advOperator}
          dataService={advServiceData}
          smsService={advServiceSms}
          staleLuOnly={advStaleLuOnly}
          kiteAlias={kiteAlias}
          kiteCommercialGroup={kiteCommercialGroup}
          kiteSupervisionGroup={kiteSupervisionGroup}
          kiteServicePack={kiteServicePack}
          kiteCustomFields={kiteCustomFields}
          tele2RatePlan={tele2RatePlan}
          tele2CommunicationPlan={tele2CommunicationPlan}
          tele2AccountId={tele2AccountId}
          tele2AccountCustoms={tele2AccountCustoms}
          tele2OperatorCustoms={tele2OperatorCustoms}
          tele2CustomerCustoms={tele2CustomerCustoms}
          moabitsProductName={moabitsProductName}
          moabitsProductCode={moabitsProductCode}
          moabitsCompanyCode={moabitsCompanyCode}
          moabitsAutorenewal={moabitsAutorenewal}
          moabitsDataLimitMb={moabitsDataLimitMb}
          moabitsSmsLimit={moabitsSmsLimit}
          moabitsCountry={moabitsCountry}
          moabitsRatType={moabitsRatType}
        />

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <StatusFilterControls
            activeSrc={activeSrc}
            activeStatus={activeStatus}
            statusSelections={statusSelections}
            activeProviders={activeProviderIds}
            statusCount={statusCount}
            selectedCount={statusFilterCount}
            onActiveStatusChange={setActiveStatus}
            onClearSelections={() => setStatusSelections({})}
            onToggleSelection={(provider, status) => setStatusSelections((prev) => toggleStatusSelection(prev, provider, status))}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: T.fontMono }}>
              {rows.length} resultado{rows.length !== 1 ? "s" : ""}
            </div>
            <button
              onClick={() => setAdvOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 11px",
                borderRadius: 4,
                border: `1px solid ${advCount > 0 ? T.headerBg : T.border}`,
                background: advCount > 0 ? T.headerBg : "#fff",
                color: advCount > 0 ? "#fff" : T.text,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: T.fontBody,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Icon.filter size={13} />
              Filtros avanzados
              {advCount > 0 && <span style={{ background: "#fff", color: T.headerBg, fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700, padding: "0 5px", borderRadius: 8, minWidth: 16, textAlign: "center", lineHeight: "15px" }}>{advCount}</span>}
            </button>
          </div>
        </div>

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

      {advOpen && (
        <>
          <div onClick={() => setAdvOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,30,40,.28)", zIndex: 60 }} />
          <aside
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "min(320px, 92vw)",
              background: T.cardBg,
              borderRight: `1px solid ${T.border}`,
              boxShadow: "12px 0 32px rgba(20,40,50,.10)",
              zIndex: 61,
              display: "flex",
              flexDirection: "column",
              fontFamily: T.fontBody,
            }}
          >
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, background: T.tableHeaderBg }}>
              <Icon.filter size={14} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.title, letterSpacing: -0.1 }}>Filtros avanzados</div>
              <div style={{ flex: 1 }} />
              <button onClick={() => setAdvOpen(false)} title="Cerrar" style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", padding: 4, lineHeight: 0, borderRadius: 4 }}>
                <Icon.close size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
              <DrawerGroup title="FUENTES">
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: allSelected(advSrcs, activeProviderIds) ? T.tableHeaderBg : "transparent" }}>
                  <input type="checkbox" checked={allSelected(advSrcs, activeProviderIds)} onChange={() => setAdvSrcs(null)} style={{ accentColor: T.headerBg }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundImage: conicGradient }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: T.title, flex: 1 }}>Todas</span>
                  <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{enrichedInitialRows.length}</span>
                </label>
                {activeProviderIds.map((provider) => SOURCES[provider]).map((s) => {
                  const checked = visibleSet(advSrcs, activeProviderIds).has(s.id)
                  return (
                    <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: checked ? s.tintBg : "transparent" }}>
                      <input type="checkbox" checked={checked} onChange={() => setAdvSrcs((prev) => toggleInSet(prev, s.id, activeProviderIds))} style={{ accentColor: s.color }} />
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.title, flex: 1 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{enrichedInitialRows.filter((r) => r.provider === s.id).length}</span>
                    </label>
                  )
                })}
              </DrawerGroup>

              <>
                <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />
                <DrawerGroup title="GENERALES">
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Plan</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.pageBg, border: `1px solid ${advPlan.trim() ? T.headerBg : T.border}`, borderRadius: 4, padding: "6px 9px" }}>
                          <span style={{ color: T.muted, display: "inline-flex", flexShrink: 0 }}><Icon.search size={13} /></span>
                          <input
                            value={advPlan}
                            onChange={(e) => setAdvPlan(e.target.value)}
                            placeholder="Nombre o código..."
                            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12.5, fontFamily: T.fontBody, color: T.text, minWidth: 0 }}
                          />
                          {advPlan && (
                            <button type="button" onClick={() => setAdvPlan("")} style={{ border: "none", background: "transparent", color: T.muted, cursor: "pointer", lineHeight: 0, padding: 2, flexShrink: 0 }}>
                              <Icon.close size={11} />
                            </button>
                          )}
                        </div>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Cliente</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.pageBg, border: `1px solid ${advClient.trim() ? T.headerBg : T.border}`, borderRadius: 4, padding: "6px 9px" }}>
                          <span style={{ color: T.muted, display: "inline-flex", flexShrink: 0 }}><Icon.search size={13} /></span>
                          <input
                            value={advClient}
                            onChange={(e) => setAdvClient(e.target.value)}
                            placeholder="Nombre o scope..."
                            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12.5, fontFamily: T.fontBody, color: T.text, minWidth: 0 }}
                          />
                          {advClient && (
                            <button type="button" onClick={() => setAdvClient("")} style={{ border: "none", background: "transparent", color: T.muted, cursor: "pointer", lineHeight: 0, padding: 2, flexShrink: 0 }}>
                              <Icon.close size={11} />
                            </button>
                          )}
                        </div>
                      </label>
                      <TextFilterInput label="IMEI" value={advImei} onChange={setAdvImei} placeholder="359000000000001" />
                      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Operador celular</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.pageBg, border: `1px solid ${advOperator.trim() ? T.headerBg : T.border}`, borderRadius: 4, padding: "6px 9px" }}>
                          <span style={{ color: T.muted, display: "inline-flex", flexShrink: 0 }}><Icon.search size={13} /></span>
                          <input
                            value={advOperator}
                            onChange={(e) => setAdvOperator(e.target.value)}
                            placeholder="Claro, AT&T, Telefonica..."
                            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12.5, fontFamily: T.fontBody, color: T.text, minWidth: 0 }}
                          />
                          {advOperator && (
                            <button type="button" onClick={() => setAdvOperator("")} style={{ border: "none", background: "transparent", color: T.muted, cursor: "pointer", lineHeight: 0, padding: 2, flexShrink: 0 }}>
                              <Icon.close size={11} />
                            </button>
                          )}
                        </div>
                      </label>
                    </div>
                </DrawerGroup>
                <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />
                <DrawerGroup title="SERVICIOS Y SEÑALIZACIÓN">
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <TristateRow
                        label="Servicio de datos"
                        value={advServiceData}
                        onChange={setAdvServiceData}
                      />
                      <TristateRow
                        label="Servicio SMS"
                        value={advServiceSms}
                        onChange={setAdvServiceSms}
                      />
                      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: advStaleLuOnly ? T.tableHeaderBg : "transparent" }}>
                        <input
                          type="checkbox"
                          checked={advStaleLuOnly}
                          onChange={(e) => setAdvStaleLuOnly(e.target.checked)}
                          style={{ accentColor: T.warning }}
                        />
                        <span style={{ fontSize: 12.5, color: T.title, fontWeight: 600 }}>Sólo SIMs sin LU reciente (&gt; 30 días)</span>
                      </label>
                    </div>
                </DrawerGroup>
                {isAdmin && activeSrc !== "all" && (
                  <>
                    <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />
                    <ProviderSpecificFilters
                      activeSrc={activeSrc}
                      kiteAlias={kiteAlias}
                      setKiteAlias={setKiteAlias}
                      kiteCommercialGroup={kiteCommercialGroup}
                      setKiteCommercialGroup={setKiteCommercialGroup}
                      kiteSupervisionGroup={kiteSupervisionGroup}
                      setKiteSupervisionGroup={setKiteSupervisionGroup}
                      kiteServicePack={kiteServicePack}
                      setKiteServicePack={setKiteServicePack}
                      kiteCustomFields={kiteCustomFields}
                      setKiteCustomFields={setKiteCustomFields}
                      tele2RatePlan={tele2RatePlan}
                      setTele2RatePlan={setTele2RatePlan}
                      tele2CommunicationPlan={tele2CommunicationPlan}
                      setTele2CommunicationPlan={setTele2CommunicationPlan}
                      tele2AccountId={tele2AccountId}
                      setTele2AccountId={setTele2AccountId}
                      tele2AccountCustoms={tele2AccountCustoms}
                      setTele2AccountCustoms={setTele2AccountCustoms}
                      tele2OperatorCustoms={tele2OperatorCustoms}
                      setTele2OperatorCustoms={setTele2OperatorCustoms}
                      tele2CustomerCustoms={tele2CustomerCustoms}
                      setTele2CustomerCustoms={setTele2CustomerCustoms}
                      moabitsProductName={moabitsProductName}
                      setMoabitsProductName={setMoabitsProductName}
                      moabitsProductCode={moabitsProductCode}
                      setMoabitsProductCode={setMoabitsProductCode}
                      moabitsCompanyCode={moabitsCompanyCode}
                      setMoabitsCompanyCode={setMoabitsCompanyCode}
                      moabitsAutorenewal={moabitsAutorenewal}
                      setMoabitsAutorenewal={setMoabitsAutorenewal}
                      moabitsDataLimitMb={moabitsDataLimitMb}
                      setMoabitsDataLimitMb={setMoabitsDataLimitMb}
                      moabitsSmsLimit={moabitsSmsLimit}
                      setMoabitsSmsLimit={setMoabitsSmsLimit}
                      moabitsCountry={moabitsCountry}
                      setMoabitsCountry={setMoabitsCountry}
                      moabitsRatType={moabitsRatType}
                      setMoabitsRatType={setMoabitsRatType}
                    />
                  </>
                )}
              </>
            </div>

            <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, background: T.cardBg }}>
              <Btn variant="ghost" size="sm" onClick={clearAdv}>
                Limpiar
              </Btn>
              <div style={{ flex: 1 }} />
              <Btn variant="primary" size="sm" onClick={() => setAdvOpen(false)}>
                Aplicar · {rows.length}
              </Btn>
            </div>
          </aside>
        </>
      )}

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

function SyncStatusStrip({
  activeProviders,
  isAdmin,
  status,
  statusError,
  activeJob,
  triggerResult,
  triggeringProvider,
  isTriggering,
  onTrigger,
}: {
  activeProviders: SourceId[]
  isAdmin: boolean
  status?: SyncStatusOut
  statusError: string | null
  activeJob?: AsyncJobOut
  triggerResult?: SyncTriggerActionResult
  triggeringProvider: SourceId | null
  isTriggering: boolean
  onTrigger: (provider: SourceId) => void
}) {
  const inFlight = new Map((status?.in_flight ?? []).map((job) => [job.provider, job]))
  const alreadyRunning = triggerResult && !triggerResult.ok && triggerResult.alreadyRunning

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", margin: "0 0 14px" }}>
      {activeProviders.map((provider) => {
        const source = SOURCES[provider]
        const freshness = status?.providers?.[provider]
        const inFlightJob = inFlight.get(provider)
        const lastFinished = freshness?.last_finished_at ?? freshness?.last_sync_at ?? null
        const lastStatus = freshness?.last_status ?? freshness?.status ?? null
        const isBusy = Boolean(inFlightJob) || (activeJob?.provider === provider && activeJob.status !== "done" && activeJob.status !== "failed")
        const isTriggeringProvider = isTriggering && triggeringProvider === provider
        const progress = activeJob?.provider === provider ? activeJob.progress : inFlightJob?.progress
        return (
          <div
            key={provider}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 32,
              border: `1px solid ${lastStatus === "failed" ? T.danger + "66" : T.border}`,
              background: lastStatus === "failed" ? "#FBEAE7" : "#fff",
              color: T.text,
              borderRadius: 6,
              padding: "5px 7px 5px 8px",
              fontSize: 11.5,
              minWidth: 0,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isBusy ? T.warning : source.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 800, color: T.title }}>{source.name}</span>
            <span style={{ color: T.muted, fontFamily: T.fontMono }}>
              {isBusy ? progressLabel(progress) : lastFinished ? relativeTime(lastFinished) : "sin sync"}
            </span>
            {lastStatus === "failed" && <span style={{ color: T.danger, fontWeight: 800 }}>falló</span>}
            {isAdmin && (
              <button
                type="button"
                disabled={isTriggeringProvider || isBusy}
                aria-busy={isTriggeringProvider || isBusy || undefined}
                onClick={() => onTrigger(provider)}
                title="Refrescar enrutamiento"
                style={{
                  border: "none",
                  background: "transparent",
                  color: source.tintText,
                  cursor: isTriggeringProvider || isBusy ? "wait" : "pointer",
                  display: "inline-flex",
                  padding: 3,
                  lineHeight: 0,
                }}
              >
                {isTriggeringProvider || isBusy ? <InlineSpinner color={source.tintText} size={12} /> : <Icon.refresh size={12} />}
              </button>
            )}
          </div>
        )
      })}
      {alreadyRunning && (
        <span style={{ color: T.warning, fontSize: 12, fontWeight: 700 }}>
          Ya hay una sincronización en curso.
        </span>
      )}
      {statusError && <span style={{ color: T.danger, fontSize: 12 }}>{statusError}</span>}
      {activeJob?.status === "failed" && (
        <span style={{ color: T.danger, fontSize: 12 }}>
          Job fallido: {activeJob.error?.detail || activeJob.error?.code || activeJob.job_id}
        </span>
      )}
    </div>
  )
}

function InlineSpinner({ color = "currentColor", size = 12 }: { color?: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}55`,
        borderTopColor: color,
        display: "inline-block",
        animation: "bismark-inline-spin .7s linear infinite",
      }}
    />
  )
}

function progressLabel(progress: AsyncJobOut["progress"] | undefined) {
  if (!progress) return "en curso"
  if (progress.total != null) return `${progress.done}/${progress.total}`
  return `${progress.done}`
}

function relativeTime(value: string) {
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return fmtShortDate(value)
  const diffMs = Date.now() - time
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return "ahora"
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `hace ${hours}h`
  return fmtShortDate(value)
}

function DetailsResolutionNotice({
  unresolved,
  filteredOut,
  activeProvider,
  isAdmin,
  onRefreshRouting,
  isRefreshingRouting = false,
}: {
  unresolved: string[]
  filteredOut: string[]
  activeProvider?: SourceId
  isAdmin: boolean
  onRefreshRouting?: () => void
  isRefreshingRouting?: boolean
}) {
  return (
    <div style={{ marginTop: 14, border: `1px solid ${T.warning}55`, background: "#FDF4E1", color: "#6B4A0E", borderRadius: 6, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.45, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ color: T.warning, display: "inline-flex", marginTop: 1 }}><Icon.warn size={14} /></span>
      <div style={{ flex: 1 }}>
        {unresolved.length > 0 && (
          <div>
            <strong style={{ fontWeight: 800 }}>{unresolved.length} ICCID sin ruta.</strong>{" "}
            {isAdmin ? "Refresca el enrutamiento para reconstruir el mapa." : "Pide a un admin refrescar el enrutamiento."}
          </div>
        )}
        {filteredOut.length > 0 && (
          <div style={{ marginTop: unresolved.length ? 3 : 0 }}>
            {filteredOut.length} ICCID resuelto{filteredOut.length !== 1 ? "s" : ""} fuera del filtro{activeProvider ? ` ${SOURCES[activeProvider].name}` : ""}.
          </div>
        )}
      </div>
      {onRefreshRouting && (
        <button
          type="button"
          onClick={onRefreshRouting}
          disabled={isRefreshingRouting}
          aria-busy={isRefreshingRouting || undefined}
          style={{ border: `1px solid ${T.warning}55`, background: "#fff", color: "#6B4A0E", borderRadius: 4, padding: "5px 8px", fontSize: 12, fontWeight: 800, cursor: isRefreshingRouting ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, opacity: isRefreshingRouting ? 0.72 : 1 }}
        >
          {isRefreshingRouting ? <InlineSpinner color="#6B4A0E" size={12} /> : <Icon.refresh size={12} />}
          {isRefreshingRouting ? "Refrescando..." : "Refrescar"}
        </button>
      )}
    </div>
  )
}

function DetailsQueryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ marginTop: 14, border: `1px solid ${T.danger}44`, background: "#FBEAE7", color: T.danger, borderRadius: 6, padding: "10px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 10 }}>
      <Icon.warn size={14} />
      <span style={{ flex: 1 }}>{message}</span>
      <button type="button" onClick={onRetry} style={{ border: `1px solid ${T.danger}55`, background: "#fff", color: T.danger, borderRadius: 4, padding: "5px 8px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
        Reintentar
      </button>
    </div>
  )
}

function DetailCellSkeleton({ wide = false }: { wide?: boolean }) {
  return <span style={{ width: wide ? 92 : 58, height: 10, borderRadius: 3, background: "#E2EAEC", display: "inline-block" }} />
}

function RowDetailState({ detail, fallbackValue, onRetry }: { detail: SimDetailsResult; fallbackValue?: string | null; onRetry: () => void }) {
  const retryAfter = detail.error?.retry_after
  const fallback = stringOrNull(fallbackValue === "—" ? null : fallbackValue)
  const label =
    detail.status === "timeout" ? "Timeout" :
    detail.status === "rate_limited" ? `Límite${retryAfter ? ` · ${retryAfter}s` : ""}` :
    detail.status === "not_found" ? "No encontrada" :
    "Error"
  const canRetry = detail.status === "timeout" || detail.status === "error" || (detail.status === "rate_limited" && !retryAfter)
  const title = [detail.error?.code, detail.error?.detail].filter(Boolean).join(" · ") || label

  if (fallback) {
    return (
      <span title={title} style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fallback}</span>
        <span style={{ color: T.warning, display: "inline-flex", flexShrink: 0 }}>
          <Icon.warn size={13} />
        </span>
        {canRetry && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onRetry()
            }}
            style={{ border: `1px solid ${T.border}`, background: "#fff", color: T.headerBg, borderRadius: 4, padding: "2px 5px", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
          >
            Reintentar
          </button>
        )}
      </span>
    )
  }

  return (
    <span title={title} style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0, color: detail.status === "not_found" ? T.muted : T.danger }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {canRetry && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRetry()
          }}
          style={{ border: `1px solid ${T.border}`, background: "#fff", color: T.headerBg, borderRadius: 4, padding: "2px 5px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
        >
          Reintentar
        </button>
      )}
    </span>
  )
}

function SubscriptionsPaginationControls({
  page,
  size,
  rowsShown,
  total,
  partial,
  partialLabel,
  nextCursor,
  currentCursor,
  cursorStack,
  pathname,
  searchParams,
}: {
  page: number
  size: number
  rowsShown: number
  total: number | null
  partial: boolean
  partialLabel: string
  nextCursor: string | null
  currentCursor: string
  cursorStack: string[]
  pathname: string
  searchParams: ReturnType<typeof useSearchParams>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const hasPrevious = page > 1 && (cursorStack.length > 0 || Boolean(currentCursor))
  const hasNext = Boolean(nextCursor)

  function hrefFor(nextParams: URLSearchParams) {
    const next = nextParams.toString()
    return `${pathname}${next ? `?${next}` : ""}`
  }

  function nextHref() {
    const params = new URLSearchParams(searchParams)
    if (!nextCursor) return hrefFor(params)
    params.set("cursor", nextCursor)
    params.set("cursor_stack", JSON.stringify([...cursorStack, currentCursor || ""]))
    params.set("page", String(page + 1))
    return hrefFor(params)
  }

  function previousHref() {
    const params = new URLSearchParams(searchParams)
    const previousCursor = cursorStack[cursorStack.length - 1] ?? ""
    const nextStack = cursorStack.slice(0, -1)
    setParam(params, "cursor", previousCursor || null)
    setParam(params, "cursor_stack", nextStack.length ? JSON.stringify(nextStack) : null)
    const previousPage = Math.max(1, page - 1)
    setParam(params, "page", previousPage > 1 ? String(previousPage) : null)
    return hrefFor(params)
  }

  function sizeHref(nextSize: number) {
    const params = new URLSearchParams(searchParams)
    params.set("size", String(nextSize))
    dropPaginationParams(params)
    return hrefFor(params)
  }

  function go(href: string) {
    startTransition(() => router.push(href))
  }

  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", fontSize: 12, color: T.muted }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: T.fontMono }}>
          Página {page} · {rowsShown} SIM{rowsShown !== 1 ? "s" : ""}
        </span>
        {total !== null && <span style={{ fontFamily: T.fontMono }}>{total} en esta consulta</span>}
        {partial && <span>{partialLabel}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontWeight: 600 }}>
          Mostrar
          <select
            value={size}
            disabled={isPending}
            onChange={(event) => go(sizeHref(Number(event.target.value)))}
            style={{ height: 32, border: `1px solid ${T.border}`, background: "#fff", color: T.text, borderRadius: 5, padding: "0 8px", fontFamily: T.fontBody, fontWeight: 700 }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!hasPrevious || isPending}
          onClick={() => go(previousHref())}
          style={{
            border: `1px solid ${hasPrevious ? "#94A3B8" : "#CBD5E1"}`,
            background: hasPrevious ? "#E8EEF2" : "#EEF3F5",
            color: hasPrevious ? "#334155" : "#64748B99",
            borderRadius: 5,
            padding: "7px 10px",
            cursor: hasPrevious && !isPending ? "pointer" : "not-allowed",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: T.fontBody,
          }}
        >
          {isPending && hasPrevious ? "Cargando..." : "Anterior"}
        </button>
        <button
          type="button"
          disabled={!hasNext || isPending}
          onClick={() => go(nextHref())}
          style={{
            border: `1px solid ${hasNext ? "#0E749055" : "#B8DDE1"}`,
            background: hasNext ? "#D8F0F2" : "#E3F1F2",
            color: hasNext ? "#155E75" : "#32647288",
            borderRadius: 5,
            padding: "7px 10px",
            cursor: hasNext && !isPending ? "pointer" : "not-allowed",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: T.fontBody,
          }}
        >
          {isPending && hasNext ? "Cargando..." : "Siguiente"}
        </button>
      </div>
    </div>
  )
}

function PartialProvidersNotice({ failedProviders }: { failedProviders: FailedProvider[] }) {
  const names = Array.from(new Set(failedProviders.map((f) => sourceName(f.provider)))).join(", ")
  return (
    <div
      style={{
        marginTop: 14,
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        border: `1px solid ${T.warning}55`,
        background: "#FDF4E1",
        color: "#6B4A0E",
        borderRadius: 6,
        padding: "10px 12px",
        fontSize: 12.5,
        lineHeight: 1.45,
      }}
    >
      <span style={{ color: T.warning, display: "inline-flex", marginTop: 1 }}>
        <Icon.warn size={14} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontWeight: 800 }}>Vista parcial.</strong> No se pudo consultar {names}.
        <div style={{ color: T.muted, fontSize: 11.5, marginTop: 2, fontFamily: T.fontMono }}>
          {failedProviders.map((f) => `${sourceName(f.provider)}: ${f.title || f.code}`).join(" · ")}
        </div>
      </div>
    </div>
  )
}

function sourceName(provider: string) {
  return provider in SOURCES ? SOURCES[provider as SourceId].name : provider
}

function StatusFilterControls({
  activeSrc,
  activeStatus,
  statusSelections,
  activeProviders,
  statusCount,
  selectedCount,
  onActiveStatusChange,
  onClearSelections,
  onToggleSelection,
}: {
  activeSrc: SourceFilter
  activeStatus: StatusFilter
  statusSelections: NativeStatusSelections
  activeProviders: SourceId[]
  statusCount: (provider: SourceId, status: string) => number
  selectedCount: number
  onActiveStatusChange: (status: StatusFilter) => void
  onClearSelections: () => void
  onToggleSelection: (provider: SourceId, status: string) => void
}) {
  if (activeSrc !== "all") {
    const source = SOURCES[activeSrc]
    return (
      <div style={{ display: "grid", gap: 7, minWidth: 0, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Estado
          </div>
          {selectedCount > 0 && <span style={{ fontSize: 11, color: source.tintText, fontFamily: T.fontMono, fontWeight: 700 }}>{selectedCount}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Chip active={activeStatus === "all"} color={source.color} onClick={() => onActiveStatusChange("all")}>
            Todos
          </Chip>
          {PROVIDER_NATIVE_STATUSES[activeSrc].map((status) => (
            <StatusOptionChip
              key={status.value}
              value={status.value}
              label={status.label}
              tone={status.tone}
              count={statusCount(activeSrc, status.value)}
              active={activeStatus !== "all" && statusKey(activeStatus) === statusKey(status.value)}
              onClick={() => onActiveStatusChange(status.value)}
            />
          ))}
        </div>
      </div>
    )
  }

  const anySelected = hasStatusSelections(statusSelections, activeProviders)
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 0, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Estado por fuente
        </div>
        {selectedCount > 0 && <span style={{ fontSize: 11, color: T.headerBg, fontFamily: T.fontMono, fontWeight: 700 }}>{selectedCount}</span>}
        <Chip active={!anySelected} onClick={onClearSelections}>
          Todos
        </Chip>
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", alignItems: "start" }}>
        {activeProviders.map((provider) => {
          const source = SOURCES[provider]
          return (
            <div key={provider} style={{ display: "grid", gap: 7, minWidth: 0, alignContent: "start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: source.color }} />
                <span style={{ fontSize: 11.5, color: T.title, fontWeight: 800 }}>{source.name}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
                {PROVIDER_NATIVE_STATUSES[provider].map((status) => (
                  <StatusOptionChip
                    key={status.value}
                    value={status.value}
                    label={status.label}
                    tone={status.tone}
                    count={statusCount(provider, status.value)}
                    active={Boolean(statusSelections[provider]?.has(status.value))}
                    onClick={() => onToggleSelection(provider, status.value)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusOptionChip({
  value,
  label,
  tone,
  count,
  active,
  onClick,
}: {
  value: string
  label: string
  tone: keyof typeof STATUS_TONES
  count: number
  active: boolean
  onClick: () => void
}) {
  const palette = STATUS_TONES[tone]
  return (
    <button
      type="button"
      title={value}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 28,
        padding: "5px 8px",
        borderRadius: 4,
        border: `1px solid ${active ? palette.dot : T.border}`,
        background: active ? palette.bg : "#fff",
        color: active ? palette.color : T.text,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: T.fontBody,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: palette.dot, flexShrink: 0 }} />
      <span>{label}</span>
      <span style={{ color: active ? palette.color : T.muted, fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700 }}>{count}</span>
    </button>
  )
}

function DrawerGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function ProviderSpecificFilters({
  activeSrc,
  kiteAlias,
  setKiteAlias,
  kiteCommercialGroup,
  setKiteCommercialGroup,
  kiteSupervisionGroup,
  setKiteSupervisionGroup,
  kiteServicePack,
  setKiteServicePack,
  kiteCustomFields,
  setKiteCustomFields,
  tele2RatePlan,
  setTele2RatePlan,
  tele2CommunicationPlan,
  setTele2CommunicationPlan,
  tele2AccountId,
  setTele2AccountId,
  tele2AccountCustoms,
  setTele2AccountCustoms,
  tele2OperatorCustoms,
  setTele2OperatorCustoms,
  tele2CustomerCustoms,
  setTele2CustomerCustoms,
  moabitsProductName,
  setMoabitsProductName,
  moabitsProductCode,
  setMoabitsProductCode,
  moabitsCompanyCode,
  setMoabitsCompanyCode,
  moabitsAutorenewal,
  setMoabitsAutorenewal,
  moabitsDataLimitMb,
  setMoabitsDataLimitMb,
  moabitsSmsLimit,
  setMoabitsSmsLimit,
  moabitsCountry,
  setMoabitsCountry,
  moabitsRatType,
  setMoabitsRatType,
}: {
  activeSrc: SourceId
  kiteAlias: string
  setKiteAlias: (value: string) => void
  kiteCommercialGroup: string
  setKiteCommercialGroup: (value: string) => void
  kiteSupervisionGroup: string
  setKiteSupervisionGroup: (value: string) => void
  kiteServicePack: string
  setKiteServicePack: (value: string) => void
  kiteCustomFields: string[]
  setKiteCustomFields: (values: string[]) => void
  tele2RatePlan: string
  setTele2RatePlan: (value: string) => void
  tele2CommunicationPlan: string
  setTele2CommunicationPlan: (value: string) => void
  tele2AccountId: string
  setTele2AccountId: (value: string) => void
  tele2AccountCustoms: string[]
  setTele2AccountCustoms: (values: string[]) => void
  tele2OperatorCustoms: string[]
  setTele2OperatorCustoms: (values: string[]) => void
  tele2CustomerCustoms: string[]
  setTele2CustomerCustoms: (values: string[]) => void
  moabitsProductName: string
  setMoabitsProductName: (value: string) => void
  moabitsProductCode: string
  setMoabitsProductCode: (value: string) => void
  moabitsCompanyCode: string
  setMoabitsCompanyCode: (value: string) => void
  moabitsAutorenewal: "any" | "on" | "off"
  setMoabitsAutorenewal: (value: "any" | "on" | "off") => void
  moabitsDataLimitMb: string
  setMoabitsDataLimitMb: (value: string) => void
  moabitsSmsLimit: string
  setMoabitsSmsLimit: (value: string) => void
  moabitsCountry: string
  setMoabitsCountry: (value: string) => void
  moabitsRatType: string
  setMoabitsRatType: (value: string) => void
}) {
  if (activeSrc === "kite") {
    return (
      <DrawerGroup title="ESPECÍFICOS DEL PROVEEDOR">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TextFilterInput label="Alias" value={kiteAlias} onChange={setKiteAlias} placeholder="Nombre de SIM..." />
          <TextFilterInput label="Commercial group" value={kiteCommercialGroup} onChange={setKiteCommercialGroup} placeholder="Grupo comercial..." />
          <TextFilterInput label="Supervision group" value={kiteSupervisionGroup} onChange={setKiteSupervisionGroup} placeholder="Grupo de supervisión..." />
          <TextFilterInput label="Service pack" value={kiteServicePack} onChange={setKiteServicePack} placeholder="Pack de servicio..." />
          {kiteCustomFields.map((value, index) => (
            <TextFilterInput
              key={index}
              label={`Custom field ${index + 1}`}
              value={value}
              onChange={(nextValue) => {
                const next = [...kiteCustomFields]
                next[index] = nextValue
                setKiteCustomFields(next)
              }}
              placeholder={`customField${index + 1}`}
            />
          ))}
        </div>
      </DrawerGroup>
    )
  }
  if (activeSrc === "tele2") {
    return (
      <DrawerGroup title="ESPECÍFICOS DEL PROVEEDOR">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TextFilterInput label="Rate plan" value={tele2RatePlan} onChange={setTele2RatePlan} placeholder="PAYU, pooled..." />
          <TextFilterInput label="Communication plan" value={tele2CommunicationPlan} onChange={setTele2CommunicationPlan} placeholder="Data LTE SMS..." />
          <TextFilterInput label="Account ID" value={tele2AccountId} onChange={setTele2AccountId} placeholder="100020620" />
          <IndexedTextFilters labelPrefix="Account custom" values={tele2AccountCustoms} onChange={setTele2AccountCustoms} />
          <IndexedTextFilters labelPrefix="Operator custom" values={tele2OperatorCustoms} onChange={setTele2OperatorCustoms} />
          <IndexedTextFilters labelPrefix="Customer custom" values={tele2CustomerCustoms} onChange={setTele2CustomerCustoms} />
        </div>
      </DrawerGroup>
    )
  }
  return (
    <DrawerGroup title="ESPECÍFICOS DEL PROVEEDOR">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <TextFilterInput label="Plan asociado" value={moabitsProductName} onChange={setMoabitsProductName} placeholder="15MB Fixed Plan..." />
        <TextFilterInput label="Código de producto" value={moabitsProductCode} onChange={setMoabitsProductCode} placeholder="FP15M-Z5-01" />
        <TextFilterInput label="Company code" value={moabitsCompanyCode} onChange={setMoabitsCompanyCode} placeholder="48123" />
        <TristateRow label="Auto-renovación" value={moabitsAutorenewal} onChange={setMoabitsAutorenewal} />
        <TextFilterInput label="Límite datos MB" value={moabitsDataLimitMb} onChange={setMoabitsDataLimitMb} placeholder="1500" />
        <TextFilterInput label="Límite SMS" value={moabitsSmsLimit} onChange={setMoabitsSmsLimit} placeholder="100" />
        <TextFilterInput label="País" value={moabitsCountry} onChange={setMoabitsCountry} placeholder="Colombia" />
        <TextFilterInput label="RAT" value={moabitsRatType} onChange={setMoabitsRatType} placeholder="4G, LTE..." />
      </div>
    </DrawerGroup>
  )
}

function IndexedTextFilters({
  labelPrefix,
  values,
  onChange,
}: {
  labelPrefix: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  return (
    <>
      {values.map((value, index) => (
        <TextFilterInput
          key={`${labelPrefix}-${index}`}
          label={`${labelPrefix} ${index + 1}`}
          value={value}
          onChange={(nextValue) => {
            const next = [...values]
            next[index] = nextValue
            onChange(next)
          }}
          placeholder={`${labelPrefix.replace(/\s+/g, "")}${index + 1}`}
        />
      ))}
    </>
  )
}

function TextFilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.pageBg, border: `1px solid ${value.trim() ? T.headerBg : T.border}`, borderRadius: 4, padding: "6px 9px" }}>
        <span style={{ color: T.muted, display: "inline-flex", flexShrink: 0 }}><Icon.search size={13} /></span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12.5, fontFamily: T.fontBody, color: T.text, minWidth: 0 }}
        />
        {value && (
          <button type="button" onClick={() => onChange("")} style={{ border: "none", background: "transparent", color: T.muted, cursor: "pointer", lineHeight: 0, padding: 2, flexShrink: 0 }}>
            <Icon.close size={11} />
          </button>
        )}
      </div>
    </label>
  )
}

function TristateRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: "any" | "on" | "off"
  onChange: (v: "any" | "on" | "off") => void
}) {
  const options: { key: "any" | "on" | "off"; label: string; tone: string }[] = [
    { key: "any", label: "Cualquiera", tone: T.muted },
    { key: "on", label: "Activo", tone: T.success },
    { key: "off", label: "Inactivo", tone: T.danger },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map((o) => {
          const active = value === o.key
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              style={{
                flex: 1,
                padding: "5px 8px",
                border: `1px solid ${active ? o.tone : T.border}`,
                background: active ? o.tone : "#fff",
                color: active ? "#fff" : T.text,
                borderRadius: 4,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: T.fontBody,
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RoutingMapEmptyState({
  failedProviders = [],
  activeProviders = PROVIDER_IDS,
}: {
  failedProviders?: FailedProvider[]
  activeProviders?: SourceId[]
}) {
  const providerHref = activeProviders.length > 0
    ? `/dashboard/subscriptions?provider=${activeProviders[0]}`
    : "/dashboard/subscriptions"

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Listado global pendiente</p>
        <h1 className="mt-2 text-2xl font-bold text-title">Importa SIMs para activar la vista global</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-900">
          El backend aun no tiene mapa de enrutamiento ICCID-proveedor. Puedes cargar un CSV inicial o revisar un proveedor especifico.
        </p>
        {failedProviders.length > 0 && (
          <div className="mt-4 max-w-2xl rounded border border-amber-300 bg-white/70 p-3 text-sm text-amber-950">
            <p className="font-semibold">Fuentes que no respondieron durante el bootstrap:</p>
            <ul className="mt-2 space-y-1">
              {failedProviders.map((f, index) => (
                <li key={`${f.provider}-${f.code}-${index}`}>
                  <span className="font-mono">{f.provider}</span>: {f.title || f.code}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard/sims/import" className="rounded bg-header-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Importar SIMs
          </Link>
          <Link href={providerHref} className="rounded border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            Ver por proveedor
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Tablas (default / moabits) ──────────────────────────────────────────────────

type DetailsQueryLike = {
  data: { results: Record<string, SimDetailsResult> } | undefined
  isFetching: boolean
  refetch: () => unknown
}

interface TableProps {
  rows: SubscriptionRow[]
  detailsQuery: DetailsQueryLike
  hovered: string | null
  setHovered: (key: string | null) => void
  setOpenRecord: (row: SubscriptionRow | null) => void
  emptyState: ReactNode
}

function DefaultTable({ rows, detailsQuery, hovered, setHovered, setOpenRecord, emptyState }: TableProps) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS_DEFAULT,
          fontSize: 10.5,
          letterSpacing: 0.6,
          color: T.tableHeaderText,
          fontWeight: 700,
          textTransform: "uppercase",
          background: T.tableHeaderBg,
          borderBottom: `1px solid ${T.border}`,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div />
        <div style={cellH}>ICCID</div>
        <div style={cellH}>MSISDN</div>
        <div style={cellH}>IMSI</div>
        <div style={cellH}>Plan</div>
        <div style={cellH}>Operador</div>
        <div style={cellH}>Estado</div>
        <div style={cellH}>Última actualización</div>
        <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }} />
      </div>
      {emptyState}
      {rows.map((r, i) => {
        const src = SOURCES[r.provider]
        const detail = detailsQuery.data?.results[r.iccid]
        const isDetailPending = detailsQuery.isFetching && !detail
        const rowIssue = detail && detail.status !== "ok" ? detail : null
        const isNotFound = rowIssue?.status === "not_found"
        const isHov = hovered === rowKey(r)
        return (
          <div
            key={rowKey(r)}
            onClick={() => { if (!isNotFound) setOpenRecord(r) }}
            onMouseEnter={() => setHovered(rowKey(r))}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLS_DEFAULT,
              alignItems: "stretch",
              background: isNotFound ? "#F1F5F9" : isHov ? T.zebra : i % 2 ? T.zebra : T.cardBg,
              borderBottom: `1px solid ${T.rowDivider}`,
              cursor: isNotFound ? "not-allowed" : "pointer",
              transition: "background .12s",
              fontSize: 12.5,
              opacity: isNotFound ? 0.62 : 1,
            }}
          >
            <div style={{ background: src.color }} />
            <div style={{ ...cell, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 11.5, color: T.title, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.iccid}
              </span>
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", fontFamily: T.fontMono, color: T.title }}>
              {isDetailPending ? <DetailCellSkeleton /> : secondary(r.msisdn)}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", fontFamily: T.fontMono, color: T.title }}>
              {isDetailPending ? <DetailCellSkeleton /> : secondary(r.imsi)}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", color: T.title, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rowIssue ? <RowDetailState detail={rowIssue} fallbackValue={r.planDisplay} onRetry={() => detailsQuery.refetch()} /> : isDetailPending ? <DetailCellSkeleton wide /> : r.planDisplay}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", gap: 8 }}>
              <SourceBadge source={r.provider} size="sm" />
              <span style={{ fontSize: 12, color: T.title, fontWeight: 600 }}>{src.shortName}</span>
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center" }}>
              <StatusPillWithNative
                provider={r.provider}
                status={r.status}
                nativeStatus={r.nativeStatus}
                displayLabel={r.statusLabel}
                statusGroup={r.statusGroup}
                showContext={false}
                size="sm"
              />
            </div>
            <div style={{ ...cell, fontSize: 12, color: T.text, display: "flex", alignItems: "center" }}>
              {isDetailPending ? <DetailCellSkeleton /> : fmtShortDate(r.updatedAt)}
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation()
                if (!isNotFound) setOpenRecord(r)
              }}
              title="Abrir suscripción"
              style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: 12 }}
            >
              <span style={{ color: T.muted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 4 }}>
                <Icon.arrowRight size={13} />
              </span>
            </div>
          </div>
        )
      })}
    </>
  )
}

function MoabitsTable({ rows, detailsQuery, hovered, setHovered, setOpenRecord, emptyState }: TableProps) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS_MOABITS,
          fontSize: 10.5,
          letterSpacing: 0.6,
          color: T.tableHeaderText,
          fontWeight: 700,
          textTransform: "uppercase",
          background: T.tableHeaderBg,
          borderBottom: `1px solid ${T.border}`,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div />
        <div style={cellH}>ICCID</div>
        <div style={cellH}>Estado</div>
        <div style={cellH}>LastLu</div>
        <div style={cellH}>LastCdr</div>
        <div style={cellH}>IMEI</div>
        <div style={cellH}>Operador</div>
        <div style={cellH}>IMSI</div>
        <div style={cellH}>Servicios</div>
        <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }} />
      </div>
      {emptyState}
      {rows.map((r, i) => {
        const src = SOURCES[r.provider]
        const detail = detailsQuery.data?.results[r.iccid]
        const isDetailPending = detailsQuery.isFetching && !detail
        const rowIssue = detail && detail.status !== "ok" ? detail : null
        const isNotFound = rowIssue?.status === "not_found"
        const isHov = hovered === rowKey(r)
        const luStale = isStaleLu(r.lastLuAt)
        return (
          <div
            key={rowKey(r)}
            onClick={() => { if (!isNotFound) setOpenRecord(r) }}
            onMouseEnter={() => setHovered(rowKey(r))}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLS_MOABITS,
              alignItems: "stretch",
              background: isNotFound ? "#F1F5F9" : isHov ? T.zebra : i % 2 ? T.zebra : T.cardBg,
              borderBottom: `1px solid ${T.rowDivider}`,
              cursor: isNotFound ? "not-allowed" : "pointer",
              transition: "background .12s",
              fontSize: 12.5,
              opacity: isNotFound ? 0.62 : 1,
            }}
          >
            <div style={{ background: src.color }} />
            <div style={{ ...cell, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 11.5, color: T.title, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.iccid}
              </span>
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center" }}>
              <StatusPillWithNative
                provider={r.provider}
                status={r.status}
                nativeStatus={r.nativeStatus}
                displayLabel={r.statusLabel}
                statusGroup={r.statusGroup}
                showContext={false}
                size="sm"
              />
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", color: luStale ? T.warning : T.text, fontWeight: luStale ? 700 : 500 }}>
              {isDetailPending ? <DetailCellSkeleton /> : fmtShortDate(r.lastLuAt)}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", color: T.text }}>
              {isDetailPending ? <DetailCellSkeleton /> : fmtShortDate(r.lastCdrAt)}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", fontFamily: T.fontMono, color: T.title }}>
              {isDetailPending ? <DetailCellSkeleton /> : secondary(r.imei)}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", color: T.title, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rowIssue ? <RowDetailState detail={rowIssue} fallbackValue={r.operator ?? "—"} onRetry={() => detailsQuery.refetch()} /> : isDetailPending ? <DetailCellSkeleton /> : (r.operator ?? "—")}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", fontFamily: T.fontMono, color: T.title }}>
              {isDetailPending ? <DetailCellSkeleton /> : secondary(r.imsi)}
            </div>
            <div style={{ ...cell, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <ServicePill enabled={r.dataService} label="Datos" />
              <ServicePill enabled={r.smsService} label="SMS" />
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation()
                if (!isNotFound) setOpenRecord(r)
              }}
              title="Abrir suscripción"
              style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: 12 }}
            >
              <span style={{ color: T.muted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 4 }}>
                <Icon.arrowRight size={13} />
              </span>
            </div>
          </div>
        )
      })}
    </>
  )
}

function ServicePill({ enabled, label }: { enabled: boolean | null; label: string }) {
  const tone = enabled === true ? { bg: "#D7ECE4", color: "#1F6B53" } : enabled === false ? { bg: "#FADDD6", color: "#9B3A2A" } : { bg: T.zebra, color: T.muted }
  return (
    <span style={{ background: tone.bg, color: tone.color, fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99, letterSpacing: 0.2 }}>
      {label} {enabled === true ? "✓" : enabled === false ? "✗" : "—"}
    </span>
  )
}

// ── KPIs dinamicos ──────────────────────────────────────────────────────────────

const STALE_LU_MS = 30 * 24 * 60 * 60 * 1000

type KpiBucket = { key: string; label: string; count: number; tone: string }

function KpiStrip({
  rows,
  scope,
  activeSrc,
  imei,
  operator,
  dataService,
  smsService,
  staleLuOnly,
  kiteAlias,
  kiteCommercialGroup,
  kiteSupervisionGroup,
  kiteServicePack,
  kiteCustomFields,
  tele2RatePlan,
  tele2CommunicationPlan,
  tele2AccountId,
  tele2AccountCustoms,
  tele2OperatorCustoms,
  tele2CustomerCustoms,
  moabitsProductName,
  moabitsProductCode,
  moabitsCompanyCode,
  moabitsAutorenewal,
  moabitsDataLimitMb,
  moabitsSmsLimit,
  moabitsCountry,
  moabitsRatType,
}: {
  rows: SubscriptionRow[]
  scope: ViewScope
  activeSrc: SourceFilter
  imei?: string
  operator?: string
  dataService?: "any" | "on" | "off"
  smsService?: "any" | "on" | "off"
  staleLuOnly?: boolean
  kiteAlias?: string
  kiteCommercialGroup?: string
  kiteSupervisionGroup?: string
  kiteServicePack?: string
  kiteCustomFields?: string[]
  tele2RatePlan?: string
  tele2CommunicationPlan?: string
  tele2AccountId?: string
  tele2AccountCustoms?: string[]
  tele2OperatorCustoms?: string[]
  tele2CustomerCustoms?: string[]
  moabitsProductName?: string
  moabitsProductCode?: string
  moabitsCompanyCode?: string
  moabitsAutorenewal?: "any" | "on" | "off"
  moabitsDataLimitMb?: string
  moabitsSmsLimit?: string
  moabitsCountry?: string
  moabitsRatType?: string
}) {
  const providerFilterKey = JSON.stringify({
    kiteAlias,
    kiteCommercialGroup,
    kiteSupervisionGroup,
    kiteServicePack,
    kiteCustomFields,
    tele2RatePlan,
    tele2CommunicationPlan,
    tele2AccountId,
    tele2AccountCustoms,
    tele2OperatorCustoms,
    tele2CustomerCustoms,
    moabitsProductName,
    moabitsProductCode,
    moabitsCompanyCode,
    moabitsAutorenewal,
    moabitsDataLimitMb,
    moabitsSmsLimit,
    moabitsCountry,
    moabitsRatType,
  })
  const statsQuery = useQuery({
    queryKey: ["sim-stats", scope, activeSrc, imei?.trim() ?? "", operator?.trim() ?? "", dataService ?? "any", smsService ?? "any", Boolean(staleLuOnly), providerFilterKey] as const,
    queryFn: async () => {
      const result = await loadSimStats({
        scope,
        provider: activeSrc === "all" ? undefined : activeSrc,
        imei: imei?.trim() || undefined,
        operator: operator?.trim() || undefined,
        dataService,
        smsService,
        staleLuOnly,
        kiteAlias,
        kiteCommercialGroup,
        kiteSupervisionGroup,
        kiteServicePack,
        kiteCustomFields,
        tele2RatePlan,
        tele2CommunicationPlan,
        tele2AccountId,
        tele2AccountCustoms,
        tele2OperatorCustoms,
        tele2CustomerCustoms,
        moabitsProductName,
        moabitsProductCode,
        moabitsCompanyCode,
        moabitsAutorenewal,
        moabitsDataLimitMb,
        moabitsSmsLimit,
        moabitsCountry,
        moabitsRatType,
      })
      if (!result.ok) throw new Error(result.error.detail || result.error.title || "No se pudieron cargar los KPIs")
      return result.data
    },
    retry: false,
    staleTime: STALE_TIME_MS,
  })
  const buckets = useMemo<KpiBucket[]>(
    () => statsQuery.data ? computeKpisFromStats(statsQuery.data, activeSrc) : computeKpis(rows, activeSrc),
    [activeSrc, rows, statsQuery.data],
  )
  const isInitialStatsLoading = statsQuery.isLoading && !statsQuery.data
  const isRefreshingStats = statsQuery.isFetching && !isInitialStatsLoading
  const displayBuckets = isInitialStatsLoading ? computeKpisFromStats({ total: 0, by_status: {}, stale_lu_count: 0 }, activeSrc) : buckets
  if (displayBuckets.length === 0) return null
  return (
    <div
      aria-busy={statsQuery.isFetching || undefined}
      aria-live="polite"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${displayBuckets.length}, minmax(120px, 1fr))`,
        gap: 1,
        background: T.border,
        borderRadius: 6,
        overflow: "hidden",
        marginTop: 16,
      }}
    >
      {displayBuckets.map((b) => (
        <div key={b.key} style={{ background: T.cardBg, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: b.tone, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, letterSpacing: 0.7, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>
              {b.label}
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.title, fontFamily: T.fontMono, letterSpacing: -0.3 }}>
            {isInitialStatsLoading ? <KpiCountSkeleton /> : b.count.toLocaleString("es-CO")}
          </div>
        </div>
      ))}
      {(isInitialStatsLoading || isRefreshingStats || statsQuery.isError || statsQuery.data?.partial) && (
        <div style={{ gridColumn: `1 / -1`, background: T.cardBg, color: T.muted, fontSize: 11.5, padding: "7px 12px", borderTop: `1px solid ${T.border}` }}>
          {isInitialStatsLoading
            ? "Cargando KPIs agregados..."
            : isRefreshingStats
              ? "Actualizando KPIs agregados..."
              : statsQuery.isError
                ? "KPIs de la página actual."
                : "Conteo aproximado, base parcial."}
        </div>
      )}
    </div>
  )
}

function KpiCountSkeleton() {
  return (
    <span
      className="animate-pulse"
      style={{
        display: "inline-block",
        width: 64,
        height: 25,
        borderRadius: 4,
        background: T.zebra,
        verticalAlign: "middle",
      }}
    />
  )
}

function computeKpisFromStats(stats: { total: number; by_status: Record<string, number>; stale_lu_count: number }, activeSrc: SourceFilter): KpiBucket[] {
  const total: KpiBucket = { key: "total", label: "Total líneas", count: stats.total, tone: T.headerBg }
  const staleLu: KpiBucket = { key: "stale-lu", label: "Sin LU reciente", count: stats.stale_lu_count, tone: T.warning }
  const statusCount = (needle: string) =>
    Object.entries(stats.by_status).reduce((sum, [status, count]) => statusKey(status).includes(needle) ? sum + count : sum, 0)
  if (activeSrc === "moabits") {
    return [
      total,
      { key: "active", label: "Activas", count: statusCount("active"), tone: T.success },
      { key: "ready", label: "Ready", count: statusCount("ready"), tone: T.headerAccent },
      { key: "suspended", label: "Suspendidas", count: statusCount("suspended"), tone: T.danger },
      staleLu,
    ]
  }
  if (activeSrc === "kite") {
    return [
      total,
      { key: "active", label: "ACTIVE", count: stats.by_status.ACTIVE ?? 0, tone: T.success },
      { key: "test", label: "TEST", count: stats.by_status.TEST ?? 0, tone: T.headerAccent },
      { key: "activation_pendant", label: "Activation Pendant", count: stats.by_status.ACTIVATION_PENDANT ?? 0, tone: T.warning },
      { key: "inactive_new", label: "INACTIVE", count: stats.by_status.INACTIVE_NEW ?? 0, tone: T.muted },
      staleLu,
    ]
  }
  if (activeSrc === "tele2") {
    return [
      total,
      { key: "activated", label: "ACTIVATED", count: stats.by_status.ACTIVATED ?? 0, tone: T.success },
      { key: "deactivated", label: "DEACTIVATED", count: stats.by_status.DEACTIVATED ?? 0, tone: T.warning },
      { key: "purged", label: "PURGED", count: stats.by_status.PURGED ?? 0, tone: T.danger },
      { key: "inventory", label: "INVENTORY", count: stats.by_status.INVENTORY ?? 0, tone: T.muted },
      staleLu,
    ]
  }
  return [total, staleLu]
}

function computeKpis(rows: SubscriptionRow[], activeSrc: SourceFilter): KpiBucket[] {
  if (rows.length === 0) return []

  const total: KpiBucket = { key: "total", label: "Total líneas", count: rows.length, tone: T.headerBg }
  const staleLuCount = rows.filter((r) => isStaleLu(r.lastLuAt)).length
  const staleLu: KpiBucket = { key: "stale-lu", label: "Sin LU reciente", count: staleLuCount, tone: T.warning }

  if (activeSrc === "moabits") {
    return [
      total,
      countByStatus(rows, "active", "Activas", T.success),
      countByStatus(rows, "ready", "Ready", T.headerAccent),
      countByStatus(rows, "suspended", "Suspendidas", T.danger),
      staleLu,
    ]
  }
  if (activeSrc === "kite") {
    return [
      total,
      countByStatus(rows, "active", "ACTIVE", T.success),
      countByStatus(rows, "test", "TEST", T.headerAccent),
      countByStatus(rows, "activation_pendant", "Activation Pendant", T.warning),
      countByStatus(rows, "inactive_new", "INACTIVE", T.muted),
      staleLu,
    ]
  }
  if (activeSrc === "tele2") {
    return [
      total,
      countByStatus(rows, "activated", "ACTIVATED", T.success),
      countByStatus(rows, "deactivated", "DEACTIVATED", T.warning),
      countByStatus(rows, "purged", "PURGED", T.danger),
      countByStatus(rows, "inventory", "INVENTORY", T.muted),
      staleLu,
    ]
  }

  return [
    total,
    countByGroup(rows, "active_like", "Activas", T.success),
    countByGroup(rows, "test_like", "Test", T.headerAccent),
    countByGroup(rows, "suspended_like", "Suspendidas/Inactivas", T.warning),
    countByGroup(rows, "purged_like", "Purgadas", T.danger),
    countByGroup(rows, "terminal_like", "Terminales", T.muted),
    staleLu,
  ]
}

function countByStatus(rows: SubscriptionRow[], statusKeyValue: string, label: string, tone: string): KpiBucket {
  const key = statusKeyValue.toLowerCase()
  const count = rows.filter((r) => (r.status || "").trim().toLowerCase() === key).length
  return { key: `status-${key}`, label, count, tone }
}

function countByGroup(rows: SubscriptionRow[], group: string, label: string, tone: string): KpiBucket {
  const count = rows.filter((r) => (r.statusGroup || "").toLowerCase() === group).length
  return { key: `group-${group}`, label, count, tone }
}

function isStaleLu(value: string | null): boolean {
  if (!value) return true
  const ts = Date.parse(value)
  if (Number.isNaN(ts)) return true
  return Date.now() - ts > STALE_LU_MS
}
