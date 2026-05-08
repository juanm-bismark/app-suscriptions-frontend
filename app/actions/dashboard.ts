"use server"

import { ApiError } from "@/lib/api-client"
import { listSims } from "@/lib/api/sims"
import type { Provider, SimListOut } from "@/lib/types/api"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

export interface DashboardProviderHint {
  provider: Provider
  count: number | null
  partial: boolean
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
  const [globalResult, providerResults] = await Promise.all([
    listSims({ limit: 1 })
      .then((result) => ({ ok: true as const, result }))
      .catch((error: unknown) => ({ ok: false as const, error })),
    Promise.all(
      PROVIDERS.map(async (provider) => {
        const params = provider === "tele2"
          ? { provider, limit: 1, modified_since: tele2DefaultModifiedSince() }
          : { provider, limit: 1 }

        return listSims(params)
          .then((result) => ({ provider, result }))
          .catch(() => ({ provider, result: null }))
      })
    ),
  ])

  const globalTotal = globalResult.ok ? globalResult.result.total : null
  const needsImport = !globalResult.ok && isRoutingMapEmpty(globalResult.error)

  const providerHints = providerResults.map(({ provider, result }) => ({
    provider,
    count: result ? totalOrFirstPageHint(result) : null,
    partial: result?.partial ?? false,
  }))

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

function tele2DefaultModifiedSince() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z")
}
