"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { SearchMode } from "@/lib/sim-identifiers"
import { useMemo } from "react"
import type { AdvancedSubscriptionFilters } from "../../filters/advanced-filters"
import { matchesAdvancedFilters } from "../../filters/advanced-filters"
import type { SourceFilter } from "../../filters/source-filter"
import { hasStatusSelections, statusKey, type NativeStatusSelections } from "../../filters/status-filter"
import type { SourceId } from "../../tokens"
import { rowNativeStatus } from "../rows"
import type { StatusFilter } from "../types"

export function useFilteredSubscriptionRows({
  enrichedInitialRows,
  activeSrc,
  activeStatus,
  statusSelections,
  activeProviderIds,
  advancedFilters,
  isMultiIccid,
  iccidList,
  draftQ,
  activeSearchMode,
}: {
  enrichedInitialRows: SubscriptionRow[]
  activeSrc: SourceFilter
  activeStatus: StatusFilter
  statusSelections: NativeStatusSelections
  activeProviderIds: SourceId[]
  advancedFilters: AdvancedSubscriptionFilters
  isMultiIccid: boolean
  iccidList: string[]
  draftQ: string
  activeSearchMode: SearchMode
}) {
  return useMemo(
    () =>
      enrichedInitialRows.filter((row) => {
        if (activeSrc !== "all" && row.provider !== activeSrc) return false
        if (activeSrc !== "all" && activeStatus !== "all" && statusKey(rowNativeStatus(row)) !== statusKey(activeStatus)) return false
        if (activeSrc === "all" && hasStatusSelections(statusSelections, activeProviderIds)) {
          const providerStatuses = statusSelections[row.provider]
          if (!providerStatuses || !Array.from(providerStatuses).some((status) => statusKey(status) === statusKey(rowNativeStatus(row)))) return false
        }
        if (!matchesAdvancedFilters(row, advancedFilters, activeSrc)) return false
        if (isMultiIccid) return iccidList.includes(row.iccid)
        if (!draftQ.trim()) return true
        if (activeSearchMode !== "auto") {
          return (row[activeSearchMode] ?? "").toLowerCase().includes(draftQ.trim().toLowerCase())
        }
        const haystack = [row.iccid, row.msisdn, row.imsi, row.status, row.statusLabel, row.provider]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(draftQ.trim().toLowerCase())
      }),
    [activeProviderIds, activeSearchMode, activeSrc, activeStatus, advancedFilters, draftQ, enrichedInitialRows, iccidList, isMultiIccid, statusSelections],
  )
}
