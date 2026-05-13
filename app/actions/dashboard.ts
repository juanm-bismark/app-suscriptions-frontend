"use server"

import { ApiError } from "@/lib/api-client"
import { listSims } from "@/lib/api/sims"
import { requireCompanyUser } from "@/lib/auth/current-user"
import type { Provider, SimListOut } from "@/lib/types/api"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

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

  const [globalResult, providerResults] = await Promise.all([
    listSims({ limit: 1 })
      .then((result) => ({ ok: true as const, result }))
      .catch((error: unknown) => ({ ok: false as const, error })),
    Promise.all(
      PROVIDERS.map(async (provider) => {
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
  }
}

function totalOrFirstPageHint(result: SimListOut) {
  return result.total ?? result.items.length
}

function errorTitleFor(error: unknown) {
  if (!error) return null
  if (error instanceof ApiError) return error.title || error.detail || error.message
  return error instanceof Error ? error.message : "No se pudo consultar"
}

