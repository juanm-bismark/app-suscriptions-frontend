"use server"

import { ApiError } from "@/lib/api-client"
import { listSims } from "@/lib/api/sims"
import { requireCompanyUser } from "@/lib/auth/current-user"
import type { Provider, SimListOut } from "@/lib/types/api"
import { listActiveCredentialProviders } from "./providers"

export interface DashboardProviderHint {
  provider: Provider
  count: number | null
  partial: boolean
  status: "ok" | "partial" | "error"
  error: string | null
}

export interface DashboardSubscriptionOverview {
  globalTotal: number | null
  needsImport: boolean
  providerHints: DashboardProviderHint[]
  providerTotalHint: number
  activeProviders: Provider[] | null
}

function isRoutingMapEmpty(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 412 &&
    error.code === "subscription.listing_precondition_failed" &&
    error.extra?.reason === "routing_map_empty"
  )
}

export async function getDashboardSubscriptionOverview(): Promise<DashboardSubscriptionOverview> {
  await requireCompanyUser()
  const activeProviders = await listActiveCredentialProviders()

  if (activeProviders !== null && activeProviders.length === 0) {
    return {
      globalTotal: null,
      needsImport: false,
      providerHints: [],
      providerTotalHint: 0,
      activeProviders,
    }
  }

  if (activeProviders === null) {
    const globalResult = await listSims({ limit: 1 })
      .then((result) => ({ ok: true as const, result }))
      .catch((error: unknown) => ({ ok: false as const, error }))

    if (!globalResult.ok) {
      return {
        globalTotal: null,
        needsImport: isRoutingMapEmpty(globalResult.error),
        providerHints: [],
        providerTotalHint: 0,
        activeProviders,
      }
    }

    const providerHints = hintsFromProviderStatuses(globalResult.result)
    return {
      globalTotal: globalResult.result.total,
      needsImport: false,
      providerHints,
      providerTotalHint: providerHints.reduce((sum, item) => sum + (item.count ?? 0), 0),
      activeProviders,
    }
  }

  const [globalResult, providerResults] = await Promise.all([
    listSims({ limit: 1 })
      .then((result) => ({ ok: true as const, result }))
      .catch((error: unknown) => ({ ok: false as const, error })),
    Promise.all(
      activeProviders.map(async (provider) => {
        return listSims({ provider, limit: 1 })
          .then((result) => ({ provider, result, error: null }))
          .catch((error: unknown) => ({ provider, result: null, error }))
      })
    ),
  ])

  const globalTotal = globalResult.ok ? globalResult.result.total : null
  const needsImport = !globalResult.ok && isRoutingMapEmpty(globalResult.error)
  const globalFailedProviders = new Map(
    globalResult.ok
      ? globalResult.result.failed_providers.map((failed) => [failed.provider, failed.title || failed.code])
      : []
  )

  const providerHints = providerResults.map(({ provider, result, error }) => {
    const globalFailure = globalFailedProviders.get(provider)
    const partial = Boolean(result?.partial || globalFailure)
    const errorTitle = globalFailure ?? errorTitleFor(error)

    return {
      provider,
      count: result ? totalOrFirstPageHint(result) : null,
      partial,
      status: errorTitle ? "error" as const : partial ? "partial" as const : "ok" as const,
      error: errorTitle,
    }
  })

  return {
    globalTotal,
    needsImport,
    providerHints,
    providerTotalHint: providerHints.reduce((sum, item) => sum + (item.count ?? 0), 0),
    activeProviders,
  }
}

function totalOrFirstPageHint(result: SimListOut) {
  return result.total ?? result.items.length
}

function hintsFromProviderStatuses(result: SimListOut): DashboardProviderHint[] {
  return (result.provider_statuses ?? [])
    .filter((item) => item.status !== "not_queried" && isProvider(item.provider))
    .map((item) => ({
      provider: item.provider as Provider,
      count: item.count,
      partial: item.status === "partial",
      status: item.status === "ok" ? "ok" as const : item.status === "partial" ? "partial" as const : "error" as const,
      error: item.title || item.code,
    }))
}

function isProvider(value: string): value is Provider {
  return value === "kite" || value === "tele2" || value === "moabits"
}

function errorTitleFor(error: unknown) {
  if (!error) return null
  if (error instanceof ApiError) return error.title || error.detail || error.message
  return error instanceof Error ? error.message : "No se pudo consultar"
}
