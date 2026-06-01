"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { LoadSubscriptionsResult } from "@/lib/subscriptions/types"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import type { SourceId } from "../../tokens"
import { mergeRowsIntoResult } from "../rows"
import type { ViewScope } from "../types"

export function useHydrateProviderCaches({
  activeProviderIds,
  allRows,
  q,
  viewScope,
}: {
  activeProviderIds: SourceId[]
  allRows: SubscriptionRow[]
  q: string
  viewScope: ViewScope
}) {
  const queryClient = useQueryClient()
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
}
