"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { useMemo } from "react"
import type { SourceId } from "../../tokens"
import { statusKey } from "../../filters/status-filter"
import { rowNativeStatus } from "../rows"

export function useStatusAndProviderCounts(rows: SubscriptionRow[]) {
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const row of rows) {
      const key = `${row.provider}:${statusKey(rowNativeStatus(row))}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [rows])

  const providerRowCounts = useMemo(() => {
    const counts: Partial<Record<SourceId, number>> = {}
    for (const row of rows) counts[row.provider] = (counts[row.provider] ?? 0) + 1
    return counts
  }, [rows])

  return {
    providerRowCounts,
    statusCount: (provider: SourceId, status: string) => statusCounts.get(`${provider}:${statusKey(status)}`) ?? 0,
  }
}
