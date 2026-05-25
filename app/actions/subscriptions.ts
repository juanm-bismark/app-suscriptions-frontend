"use server"

import { toRow, type SubscriptionRow } from "@/lib/api/sim-mapper"
import { ApiError } from "@/lib/api-client"
import { getJob, getSimDetails, getSyncStatus, listSims, searchSims, triggerSync, type ListSimsParams } from "@/lib/api/sims"
import { requireAdmin, requireCompanyUser } from "@/lib/auth/current-user"
import { isIccid, MAX_ICCID_BATCH, parseIccidList } from "@/lib/iccid"
import type { AsyncJobOut, Provider, SimDetailsOut, SimListOut, SimSearchIn, SyncStatusOut, SyncTriggerOut } from "@/lib/types/api"
import { listActiveCredentialProviders } from "./providers"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

export type FailedProvider = { provider: string; code: string; title: string }
export type ProviderStatus = { provider: string; status: "ok" | "partial" | "error" | "not_queried"; count: number; code: string | null; title: string | null }

export interface LoadSubscriptionsInput {
  provider?: string
  status?: string
  statuses?: string
  cursor?: string
  size?: string
  q?: string
  limit?: number
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
    provider?: Provider
    status?: string
    statuses?: string
    cursor?: string
    q?: string
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

function buildSearchBody(filters: LoadSubscriptionsData["filters"], limit: number, activeProviders: readonly Provider[]): SimSearchIn | null {
  const statusSelections = parseProviderStatusSelections(filters.statuses, activeProviders)
  if (!statusSelections) return null

  const common: NonNullable<SimSearchIn["common"]> = {}
  const query = filters.q?.trim()
  if (query && isIccid(query)) {
    common.iccid = query
  }

  if (statusSelections.tele2 && !filters.cursor) {
    common.modified_since = tele2DefaultModifiedSince()
  }

  const providers: NonNullable<SimSearchIn["providers"]> = {}
  for (const provider of activeProviders) {
    const statuses = statusSelections[provider] ?? []
    if (statuses.length === 1) providers[provider] = { status: statuses[0] }
    else if (statuses.length > 1) providers[provider] = { statuses }
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
  await requireCompanyUser()
  const activeProviders = await listActiveCredentialProviders()
  const queryableProviders = activeProviders ?? PROVIDERS

  const normalizedQuery = input.q?.trim() || undefined
  const filters = {
    provider: isProvider(input.provider) && (activeProviders === null || activeProviders.includes(input.provider)) ? input.provider : undefined,
    status: input.status?.trim() || undefined,
    statuses: input.statuses?.trim() || undefined,
    cursor: input.cursor,
    q: normalizedQuery,
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
    if (iccids.length > 1 && !filters.cursor) {
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

    const searchBody = !filters.provider ? buildSearchBody(filters, apiParams.limit ?? 50, queryableProviders) : null
    let result = searchBody ? await searchSims(searchBody) : await listSims(apiParams)
    result = searchBody ? normalizeSimListResult(result) : await findFirstUsefulGlobalPage(result, apiParams, queryableProviders)

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
      error: actionErrorText(error, "No se pudo cargar la lista"),
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

function actionErrorText(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.detail || error.title || error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
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
