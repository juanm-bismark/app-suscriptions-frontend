"use server"

import { toRow, type SubscriptionRow } from "@/lib/api/sim-mapper"
import { ApiError } from "@/lib/api-client"
import { getAdminSimStats, getJob, getSimDetails, getSimStats, getSmsHistory, getStatusHistory, getLocation, getSyncStatus, listAdminSims, listSims, searchAdminSims, searchSims, triggerSync, type ListSimsParams } from "@/lib/api/sims"
import { actionErrorMessage } from "@/lib/action-error"
import { requireAdmin, requireCompanyUser } from "@/lib/auth/current-user"
import { isIccid, MAX_ICCID_BATCH, parseIccidList } from "@/lib/iccid"
import type { AsyncJobOut, LocationOut, Provider, SimDetailsOut, SimListOut, SimSearchIn, SimStatsOut, SmsHistoryOut, StatusHistoryOut, SyncStatusOut, SyncTriggerOut } from "@/lib/types/api"
import { listActiveCredentialProviders } from "./providers"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

export type FailedProvider = { provider: string; code: string; title: string }
export type ProviderStatus = { provider: string; status: "ok" | "partial" | "error" | "not_queried"; count: number; code: string | null; title: string | null }

export interface LoadSubscriptionsInput {
  scope?: "company" | "global"
  provider?: string
  status?: string
  statuses?: string
  cursor?: string
  size?: string
  q?: string
  limit?: number
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
}

export interface LoadSubscriptionsData {
  rows: SubscriptionRow[]
  detailLookup?: SimDetailsOut
  pagination: {
    nextCursor: string | null
    total: number | null
    partial: boolean
    failedProviders: FailedProvider[]
    providerStatuses: ProviderStatus[]
  }
  filters: {
    scope?: "company" | "global"
    provider?: Provider
    status?: string
    statuses?: string
    cursor?: string
    q?: string
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
  }
}

export type LoadSubscriptionsResult =
  | { ok: true; data: LoadSubscriptionsData }
  | { ok: false; kind: "routing_map_empty"; failedProviders: FailedProvider[] }
  | { ok: false; kind: "error"; error: string }

export type ActionProblem = {
  status: number
  code?: string
  title?: string
  detail?: string | null
  retryAfter?: number
}

export type SimDetailsActionResult =
  | { ok: true; data: SimDetailsOut }
  | { ok: false; error: ActionProblem }

export type SyncStatusActionResult =
  | { ok: true; data: SyncStatusOut }
  | { ok: false; error: ActionProblem }

export type SyncTriggerActionResult =
  | { ok: true; data: SyncTriggerOut }
  | { ok: false; alreadyRunning: true; error: ActionProblem }
  | { ok: false; alreadyRunning?: false; error: ActionProblem }

export type JobActionResult =
  | { ok: true; data: AsyncJobOut }
  | { ok: false; error: ActionProblem }

export type SmsHistoryActionResult =
  | { ok: true; data: SmsHistoryOut }
  | { ok: false; error: ActionProblem }

export type StatusHistoryActionResult =
  | { ok: true; data: StatusHistoryOut }
  | { ok: false; error: ActionProblem }

export type LocationActionResult =
  | { ok: true; data: LocationOut }
  | { ok: false; error: ActionProblem }

export type SimStatsActionResult =
  | { ok: true; data: SimStatsOut }
  | { ok: false; error: ActionProblem }

function isProvider(v: string | undefined): v is Provider {
  return !!v && PROVIDERS.includes(v as Provider)
}

function applySearchParam(apiParams: ListSimsParams, query: string | undefined) {
  const normalized = query?.trim()
  if (!normalized) return

  if (isIccid(normalized)) {
    apiParams.iccid = normalized
    return
  }

  // Free-text search is handled entirely client-side over the returned page
  // (see SubscriptionsList row filter). The contract's `custom` filter
  // requires `key=value` items, so sending raw text would be malformed.
}

function tele2DefaultModifiedSince() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z")
}

function parseProviderStatusSelections(value: string | undefined, activeProviders: readonly Provider[]) {
  const active = new Set(activeProviders)
  const providers: Partial<Record<Provider, string[]>> = {}
  for (const raw of (value ?? "").split(",")) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const separator = trimmed.indexOf(":")
    if (separator <= 0) continue

    const provider = trimmed.slice(0, separator)
    const status = trimmed.slice(separator + 1).trim()
    if (!isProvider(provider) || !active.has(provider) || !status) continue
    providers[provider] = providers[provider] ?? []
    if (!providers[provider]?.includes(status)) providers[provider]?.push(status)
  }
  return Object.keys(providers).length ? providers : null
}

function serviceFlag(value?: "any" | "on" | "off") {
  if (value === "on") return true
  if (value === "off") return false
  return undefined
}

function staleLuTill(enabled?: boolean) {
  if (!enabled) return undefined
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z")
}

function addTextFilter(target: Record<string, string>, key: string, value: string | undefined) {
  const trimmed = value?.trim()
  if (trimmed) target[key] = trimmed
}

function addIndexedTextFilters(target: Record<string, string>, prefix: string, values: string[] | undefined) {
  values?.forEach((value, index) => addTextFilter(target, `${prefix}${index + 1}`, value))
}

function addTristateFilter(target: Record<string, string>, key: string, value?: "any" | "on" | "off") {
  if (value === "on") target[key] = "true"
  if (value === "off") target[key] = "false"
}

function providerCustomFilters(provider: Provider, filters: LoadSubscriptionsData["filters"]) {
  const custom: Record<string, string> = {}
  if (provider === "kite") {
    addTextFilter(custom, "alias", filters.kiteAlias)
    addTextFilter(custom, "commercial_group", filters.kiteCommercialGroup)
    addTextFilter(custom, "supervision_group", filters.kiteSupervisionGroup)
    addTextFilter(custom, "service_pack", filters.kiteServicePack)
    addIndexedTextFilters(custom, "customField", filters.kiteCustomFields)
  }
  if (provider === "tele2") {
    addTextFilter(custom, "rate_plan", filters.tele2RatePlan)
    addTextFilter(custom, "communication_plan", filters.tele2CommunicationPlan)
    addTextFilter(custom, "account_id", filters.tele2AccountId)
    addIndexedTextFilters(custom, "accountCustom", filters.tele2AccountCustoms)
    addIndexedTextFilters(custom, "operatorCustom", filters.tele2OperatorCustoms)
    addIndexedTextFilters(custom, "customerCustom", filters.tele2CustomerCustoms)
  }
  if (provider === "moabits") {
    addTextFilter(custom, "product_name", filters.moabitsProductName)
    addTextFilter(custom, "product_code", filters.moabitsProductCode)
    addTextFilter(custom, "company_code", filters.moabitsCompanyCode)
    addTristateFilter(custom, "autorenewal", filters.moabitsAutorenewal)
    addTextFilter(custom, "data_limit_mb", filters.moabitsDataLimitMb)
    addTextFilter(custom, "sms_limit", filters.moabitsSmsLimit)
    addTextFilter(custom, "country", filters.moabitsCountry)
    addTextFilter(custom, "rat_type", filters.moabitsRatType)
  }
  return custom
}

function customQueryParams(provider: Provider | undefined, filters: LoadSubscriptionsData["filters"]) {
  if (!provider) return undefined
  const custom = providerCustomFilters(provider, filters)
  const entries = Object.entries(custom)
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`) : undefined
}

function hasServerAdvancedFilters(filters: LoadSubscriptionsData["filters"]) {
  return Boolean(
    filters.imei?.trim() ||
    filters.operator?.trim() ||
    filters.dataService !== "any" ||
    filters.smsService !== "any" ||
    filters.staleLuOnly ||
    filters.kiteAlias?.trim() ||
    filters.kiteCommercialGroup?.trim() ||
    filters.kiteSupervisionGroup?.trim() ||
    filters.kiteServicePack?.trim() ||
    filters.kiteCustomFields?.some((value) => value.trim()) ||
    filters.tele2RatePlan?.trim() ||
    filters.tele2CommunicationPlan?.trim() ||
    filters.tele2AccountId?.trim() ||
    filters.tele2AccountCustoms?.some((value) => value.trim()) ||
    filters.tele2OperatorCustoms?.some((value) => value.trim()) ||
    filters.tele2CustomerCustoms?.some((value) => value.trim()) ||
    filters.moabitsProductName?.trim() ||
    filters.moabitsProductCode?.trim() ||
    filters.moabitsCompanyCode?.trim() ||
    filters.moabitsAutorenewal !== "any" ||
    filters.moabitsDataLimitMb?.trim() ||
    filters.moabitsSmsLimit?.trim() ||
    filters.moabitsCountry?.trim() ||
    filters.moabitsRatType?.trim()
  )
}

function buildSearchBody(filters: LoadSubscriptionsData["filters"], limit: number, activeProviders: readonly Provider[]): SimSearchIn | null {
  const statusSelections = parseProviderStatusSelections(filters.statuses, activeProviders)
  const useAdvanced = hasServerAdvancedFilters(filters)
  if (!statusSelections && !useAdvanced) return null

  const common: NonNullable<SimSearchIn["common"]> = {}
  const query = filters.q?.trim()
  if (query && isIccid(query)) {
    common.iccid = query
  }
  if (filters.imei?.trim()) common.imei = filters.imei.trim()
  if (filters.operator?.trim()) common.operator = filters.operator.trim()
  common.data_service = serviceFlag(filters.dataService)
  common.sms_service = serviceFlag(filters.smsService)
  common.last_lu_till = staleLuTill(filters.staleLuOnly)

  if ((statusSelections?.tele2 || useAdvanced) && !filters.cursor) {
    common.modified_since = tele2DefaultModifiedSince()
  }

  const providers: NonNullable<SimSearchIn["providers"]> = {}
  for (const provider of activeProviders) {
    const statuses = statusSelections?.[provider] ?? []
    const custom = providerCustomFilters(provider, filters)
    const providerBody: NonNullable<SimSearchIn["providers"]>[Provider] = {}
    if (statuses.length === 1) providerBody.status = statuses[0]
    else if (statuses.length > 1) providerBody.statuses = statuses
    if (Object.keys(custom).length) providerBody.custom = custom
    if (statuses.length > 0 || useAdvanced || Object.keys(custom).length) providers[provider] = providerBody
  }

  if (Object.keys(providers).length === 0) return null

  return {
    limit,
    cursor: filters.cursor ?? null,
    common: Object.keys(common).length ? common : null,
    providers,
  }
}

export async function loadSubscriptions(input: LoadSubscriptionsInput): Promise<LoadSubscriptionsResult> {
  const scope: "company" | "global" = input.scope === "global" ? "global" : "company"
  if (scope === "global") await requireAdmin()
  else await requireCompanyUser()
  const activeProviders = scope === "global" ? null : await listActiveCredentialProviders()
  const queryableProviders = activeProviders ?? PROVIDERS

  const normalizedQuery = input.q?.trim() || undefined
  const filters = {
    scope,
    provider: isProvider(input.provider) && (activeProviders === null || activeProviders.includes(input.provider)) ? input.provider : undefined,
    status: input.status?.trim() || undefined,
    statuses: input.statuses?.trim() || undefined,
    cursor: input.cursor,
    q: normalizedQuery,
    imei: input.imei?.trim() || undefined,
    operator: input.operator?.trim() || undefined,
    dataService: input.dataService ?? "any",
    smsService: input.smsService ?? "any",
    staleLuOnly: Boolean(input.staleLuOnly),
    kiteAlias: input.kiteAlias?.trim() || undefined,
    kiteCommercialGroup: input.kiteCommercialGroup?.trim() || undefined,
    kiteSupervisionGroup: input.kiteSupervisionGroup?.trim() || undefined,
    kiteServicePack: input.kiteServicePack?.trim() || undefined,
    kiteCustomFields: input.kiteCustomFields ?? ["", "", "", ""],
    tele2RatePlan: input.tele2RatePlan?.trim() || undefined,
    tele2CommunicationPlan: input.tele2CommunicationPlan?.trim() || undefined,
    tele2AccountId: input.tele2AccountId?.trim() || undefined,
    tele2AccountCustoms: input.tele2AccountCustoms ?? Array.from({ length: 10 }, () => ""),
    tele2OperatorCustoms: input.tele2OperatorCustoms ?? Array.from({ length: 5 }, () => ""),
    tele2CustomerCustoms: input.tele2CustomerCustoms ?? Array.from({ length: 5 }, () => ""),
    moabitsProductName: input.moabitsProductName?.trim() || undefined,
    moabitsProductCode: input.moabitsProductCode?.trim() || undefined,
    moabitsCompanyCode: input.moabitsCompanyCode?.trim() || undefined,
    moabitsAutorenewal: input.moabitsAutorenewal ?? "any",
    moabitsDataLimitMb: input.moabitsDataLimitMb?.trim() || undefined,
    moabitsSmsLimit: input.moabitsSmsLimit?.trim() || undefined,
    moabitsCountry: input.moabitsCountry?.trim() || undefined,
    moabitsRatType: input.moabitsRatType?.trim() || undefined,
  }

  if (activeProviders !== null && activeProviders.length === 0) {
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

  const apiParams: ListSimsParams = {
    provider: filters.provider,
    status: filters.status,
    cursor: filters.cursor,
    limit: input.limit ?? 50,
  }

  applySearchParam(apiParams, filters.q)

  try {
    const iccids = parseIccidList(filters.q)
    if (scope === "company" && iccids.length > 1 && !filters.cursor) {
      const details = await getSimDetails({
        iccids,
        providers: filters.provider ? [filters.provider] : undefined,
      })
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

    const searchProviders = filters.provider ? [filters.provider] : queryableProviders
    const searchBody = buildSearchBody(filters, apiParams.limit ?? 50, searchProviders)
    const runSearch = scope === "global" ? searchAdminSims : searchSims
    const runList = scope === "global" ? listAdminSims : listSims
    let result = searchBody ? await runSearch(searchBody) : await runList(apiParams)
    result = searchBody || scope === "global" ? normalizeSimListResult(result) : await findFirstUsefulGlobalPage(result, apiParams, queryableProviders)

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
  } catch (error) {
    const reason = error instanceof ApiError ? error.extra?.reason : undefined
    if (
      error instanceof ApiError &&
      error.status === 412 &&
      error.code === "subscription.listing_precondition_failed" &&
      reason === "routing_map_empty"
    ) {
      return {
        ok: false,
        kind: "routing_map_empty",
        failedProviders: dedupeFailedProviders(readFailedProviders(error.extra?.failed_providers)),
      }
    }

    return {
      ok: false,
      kind: "error",
      error: actionErrorMessage(error, "No se pudo cargar la lista"),
    }
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

export async function loadSimDetails(input: { iccids: string[]; providers?: Provider[] }): Promise<SimDetailsActionResult> {
  await requireCompanyUser()
  const iccids = Array.from(new Set(input.iccids.map((iccid) => iccid.trim()).filter(Boolean))).slice(0, MAX_ICCID_BATCH)
  const providers = input.providers?.filter(isProvider)

  try {
    return {
      ok: true,
      data: await getSimDetails({
        iccids,
        providers: providers?.length ? Array.from(new Set(providers)).sort() as Provider[] : undefined,
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudieron cargar los detalles") }
  }
}

export async function loadSyncStatus(): Promise<SyncStatusActionResult> {
  await requireCompanyUser()
  try {
    return { ok: true, data: await getSyncStatus() }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo consultar la sincronización") }
  }
}

export async function triggerRoutingSync(provider: Provider): Promise<SyncTriggerActionResult> {
  await requireAdmin()
  try {
    return { ok: true, data: await triggerSync(provider) }
  } catch (error) {
    const problem = actionProblem(error, "No se pudo iniciar la sincronización")
    if (problem.status === 409 && problem.code === "sync.already_running") {
      return { ok: false, alreadyRunning: true, error: problem }
    }
    return { ok: false, alreadyRunning: false, error: problem }
  }
}

export async function loadJob(jobId: string): Promise<JobActionResult> {
  await requireCompanyUser()
  try {
    return { ok: true, data: await getJob(jobId) }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo consultar el job") }
  }
}

export async function loadSmsHistory(input: {
  iccid: string
  startDate?: string
  endDate?: string
}): Promise<SmsHistoryActionResult> {
  await requireCompanyUser()
  try {
    return {
      ok: true,
      data: await getSmsHistory(input.iccid, {
        start_date: input.startDate,
        end_date: input.endDate,
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo cargar el historial SMS") }
  }
}

export async function loadStatusHistory(input: {
  iccid: string
  startDate?: string
  endDate?: string
}): Promise<StatusHistoryActionResult> {
  await requireCompanyUser()
  try {
    return {
      ok: true,
      data: await getStatusHistory(input.iccid, {
        start_date: input.startDate,
        end_date: input.endDate,
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo cargar el historial de estados") }
  }
}

export async function loadLocation(input: { iccid: string }): Promise<LocationActionResult> {
  await requireCompanyUser()
  try {
    return { ok: true, data: await getLocation(input.iccid) }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo cargar la ubicación") }
  }
}

export async function loadSimStats(input: {
  scope?: "company" | "global"
  provider?: Provider
  status?: string
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
} = {}): Promise<SimStatsActionResult> {
  const scope: "company" | "global" = input.scope === "global" ? "global" : "company"
  if (scope === "global") await requireAdmin()
  else await requireCompanyUser()
  try {
    const loadStats = scope === "global" ? getAdminSimStats : getSimStats
    const filters: LoadSubscriptionsData["filters"] = {
      imei: input.imei?.trim() || undefined,
      operator: input.operator?.trim() || undefined,
      dataService: input.dataService ?? "any",
      smsService: input.smsService ?? "any",
      staleLuOnly: Boolean(input.staleLuOnly),
      kiteAlias: input.kiteAlias?.trim() || undefined,
      kiteCommercialGroup: input.kiteCommercialGroup?.trim() || undefined,
      kiteSupervisionGroup: input.kiteSupervisionGroup?.trim() || undefined,
      kiteServicePack: input.kiteServicePack?.trim() || undefined,
      kiteCustomFields: input.kiteCustomFields ?? ["", "", "", ""],
      tele2RatePlan: input.tele2RatePlan?.trim() || undefined,
      tele2CommunicationPlan: input.tele2CommunicationPlan?.trim() || undefined,
      tele2AccountId: input.tele2AccountId?.trim() || undefined,
      tele2AccountCustoms: input.tele2AccountCustoms ?? Array.from({ length: 10 }, () => ""),
      tele2OperatorCustoms: input.tele2OperatorCustoms ?? Array.from({ length: 5 }, () => ""),
      tele2CustomerCustoms: input.tele2CustomerCustoms ?? Array.from({ length: 5 }, () => ""),
      moabitsProductName: input.moabitsProductName?.trim() || undefined,
      moabitsProductCode: input.moabitsProductCode?.trim() || undefined,
      moabitsCompanyCode: input.moabitsCompanyCode?.trim() || undefined,
      moabitsAutorenewal: input.moabitsAutorenewal ?? "any",
      moabitsDataLimitMb: input.moabitsDataLimitMb?.trim() || undefined,
      moabitsSmsLimit: input.moabitsSmsLimit?.trim() || undefined,
      moabitsCountry: input.moabitsCountry?.trim() || undefined,
      moabitsRatType: input.moabitsRatType?.trim() || undefined,
    }
    return {
      ok: true,
      data: await loadStats({
        provider: input.provider,
        status: input.status,
        imei: filters.imei,
        operator: filters.operator,
        data_service: serviceFlag(filters.dataService),
        sms_service: serviceFlag(filters.smsService),
        last_lu_till: staleLuTill(filters.staleLuOnly),
        custom: customQueryParams(input.provider, filters),
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudieron cargar los KPIs") }
  }
}

async function findFirstUsefulGlobalPage(initial: SimListOut, baseParams: ListSimsParams, activeProviders: readonly Provider[]): Promise<SimListOut> {
  const normalizedResult = normalizeSimListResult(initial)

  if (normalizedResult.items.length > 0 || normalizedResult.failed_providers.length === 0) {
    return normalizedResult
  }

  return fallbackToProviderListings(normalizedResult, baseParams, activeProviders)
}

function normalizeSimListResult(initial: SimListOut): SimListOut {
  return {
    ...initial,
    items: initial.items ?? [],
    failed_providers: dedupeFailedProviders(initial.failed_providers ?? []),
    provider_statuses: initial.provider_statuses ?? [],
  }
}

async function fallbackToProviderListings(globalResult: SimListOut, baseParams: ListSimsParams, activeProviders: readonly Provider[]): Promise<SimListOut> {
  const failedProviderIds = new Set((globalResult.failed_providers ?? []).map((f) => f.provider))
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

function toFailedProvider(provider: Provider, error: unknown): FailedProvider {
  if (error instanceof ApiError) {
    return {
      provider,
      code: error.code || "provider.unavailable",
      title: error.detail || error.title || error.message || "No se pudo consultar",
    }
  }
  return {
    provider,
    code: "provider.unavailable",
    title: error instanceof Error ? error.message : "No se pudo consultar",
  }
}

function dedupeFailedProviders(failedProviders: FailedProvider[]): FailedProvider[] {
  return Array.from(
    failedProviders
      .reduce((byKey, failed) => {
        const key = `${failed.provider}:${failed.code}:${failed.title}`
        if (!byKey.has(key)) byKey.set(key, failed)
        return byKey
      }, new Map<string, FailedProvider>())
      .values()
  )
}

function readFailedProviders(value: unknown): FailedProvider[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const provider = "provider" in item && typeof item.provider === "string" ? item.provider : null
    const code = "code" in item && typeof item.code === "string" ? item.code : "provider.unavailable"
    const title = "title" in item && typeof item.title === "string" ? item.title : "No se pudo consultar"
    return provider ? [{ provider, code, title }] : []
  })
}

function actionProblem(error: unknown, fallback: string): ActionProblem {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      title: error.title,
      detail: error.detail || error.message || fallback,
      retryAfter: error.retryAfter,
    }
  }
  return {
    status: 0,
    detail: error instanceof Error ? error.message : fallback,
  }
}
