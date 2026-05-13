"use server"

import { toRow, type SubscriptionRow } from "@/lib/api/sim-mapper"
import { ApiError } from "@/lib/api-client"
import { listSims, type ListSimsParams } from "@/lib/api/sims"
import { requireCompanyUser } from "@/lib/auth/current-user"
import type { AdministrativeStatus, Provider, SimListOut } from "@/lib/types/api"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]
const STATUSES: AdministrativeStatus[] = [
  "active",
  "in_test",
  "suspended",
  "inactive_new",
  "activation_pendant",
  "activation_ready",
  "terminated",
  "purged",
  "inventory",
  "replaced",
  "retired",
  "restore",
  "pending",
  "unknown",
]

export type FailedProvider = { provider: string; code: string; title: string }
export type ProviderStatus = { provider: string; status: "ok" | "partial" | "error" | "not_queried"; count: number; code: string | null; title: string | null }

export interface LoadSubscriptionsInput {
  provider?: string
  status?: string
  cursor?: string
  q?: string
  limit?: number
}

export interface LoadSubscriptionsData {
  rows: SubscriptionRow[]
  pagination: {
    nextCursor: string | null
    total: number | null
    partial: boolean
    failedProviders: FailedProvider[]
    providerStatuses: ProviderStatus[]
  }
  filters: {
    provider?: Provider
    status?: AdministrativeStatus
    cursor?: string
    q?: string
  }
}

export type LoadSubscriptionsResult =
  | { ok: true; data: LoadSubscriptionsData }
  | { ok: false; kind: "routing_map_empty"; failedProviders: FailedProvider[] }
  | { ok: false; kind: "error"; error: string }

function isProvider(v: string | undefined): v is Provider {
  return !!v && PROVIDERS.includes(v as Provider)
}

function isStatus(v: string | undefined): v is AdministrativeStatus {
  return !!v && STATUSES.includes(v as AdministrativeStatus)
}

function applySearchParam(apiParams: ListSimsParams, query: string | undefined) {
  const normalized = query?.trim()
  if (!normalized) return

  const digitsOnly = normalized.replace(/\D/g, "")
  if (digitsOnly === normalized && digitsOnly.length >= 18 && digitsOnly.length <= 22) {
    apiParams.iccid = normalized
    return
  }

  // custom requires a provider scope — global listing with custom returns 409
  if (apiParams.provider) {
    apiParams.custom = [normalized]
  }
}

export async function loadSubscriptions(input: LoadSubscriptionsInput): Promise<LoadSubscriptionsResult> {
  await requireCompanyUser()

  const normalizedQuery = input.q?.trim() || undefined
  const filters = {
    provider: isProvider(input.provider) ? input.provider : undefined,
    status: isStatus(input.status) ? input.status : undefined,
    cursor: input.cursor,
    q: normalizedQuery,
  }

  const apiParams: ListSimsParams = {
    provider: filters.provider,
    status: filters.status,
    cursor: filters.cursor,
    limit: input.limit ?? 50,
  }

  applySearchParam(apiParams, filters.q)

  try {
    let result = await listSims(apiParams)
    result = await findFirstUsefulGlobalPage(result, apiParams)

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
      error: error instanceof Error ? error.message : "No se pudo cargar la lista",
    }
  }
}

async function findFirstUsefulGlobalPage(initial: SimListOut, baseParams: ListSimsParams): Promise<SimListOut> {
  const normalizedResult = {
    ...initial,
    items: initial.items ?? [],
    failed_providers: dedupeFailedProviders(initial.failed_providers ?? []),
    provider_statuses: initial.provider_statuses ?? [],
  }

  if (normalizedResult.items.length > 0 || normalizedResult.failed_providers.length === 0) {
    return normalizedResult
  }

  return fallbackToProviderListings(normalizedResult, baseParams)
}

async function fallbackToProviderListings(globalResult: SimListOut, baseParams: ListSimsParams): Promise<SimListOut> {
  const failedProviderIds = new Set((globalResult.failed_providers ?? []).map((f) => f.provider))
  const items: SimListOut["items"] = []
  const failedProviders = [...(globalResult.failed_providers ?? [])]
  const limit = baseParams.limit ?? 50

  for (const provider of PROVIDERS) {
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
      title: error.title || error.detail || "No se pudo consultar",
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
