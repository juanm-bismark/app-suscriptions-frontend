"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { LoadSubscriptionsData } from "@/lib/subscriptions/types"
import { loadSimDetails } from "@/app/actions/subscriptions"
import { MAX_ICCID_BATCH } from "@/lib/iccid"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type { SourceFilter } from "../../filters/source-filter"
import { mergeDetailRows, sortedUnique } from "../rows"
import type { ViewScope } from "../types"
import { DETAIL_STALE_TIME_MS } from "./constants"

export function useSubscriptionDetailQueries({
  listedRows,
  activeSrc,
  viewScope,
  initialDetailLookup,
}: {
  listedRows: SubscriptionRow[]
  activeSrc: SourceFilter
  viewScope: ViewScope
  initialDetailLookup?: LoadSubscriptionsData["detailLookup"]
}) {
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

  const enrichedRows = useMemo(
    () => mergeDetailRows(listedRows, detailsQuery.data?.results),
    [detailsQuery.data?.results, listedRows],
  )

  return {
    detailsQuery,
    enrichedRows,
  }
}
