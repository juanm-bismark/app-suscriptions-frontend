"use client"

import { useCallback, useMemo, useState } from "react"
import {
  advancedFiltersQueryKey,
  advancedFiltersToLoadInput,
  countAdvancedFilters,
  createEmptyAdvancedFilters,
  hasServerAdvancedFilters,
} from "@/lib/subscriptions/filters"
import type { SourceFilter } from "./source-filter"
import type { AdvancedArrayFilterKey, AdvancedFilterSetter, AdvancedSubscriptionFilters } from "@/lib/subscriptions/filters"

export {
  advancedFiltersQueryKey,
  advancedFiltersToLoadInput,
  createEmptyAdvancedFilters,
  matchesAdvancedFilters,
} from "@/lib/subscriptions/filters"
export type {
  AdvancedArrayFilterKey,
  AdvancedFilterSetter,
  AdvancedSubscriptionFilters,
  TristateFilter,
} from "@/lib/subscriptions/filters"

export function useAdvancedSubscriptionFilters(activeSrc: SourceFilter) {
  const [filters, setFilters] = useState<AdvancedSubscriptionFilters>(() => createEmptyAdvancedFilters())
  const setFilter = useCallback<AdvancedFilterSetter>((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }, [])
  const setArrayFilterValue = useCallback((key: AdvancedArrayFilterKey, index: number, value: string) => {
    setFilters((current) => {
      const next = [...current[key]]
      next[index] = value
      return { ...current, [key]: next }
    })
  }, [])
  const reset = useCallback(() => setFilters(createEmptyAdvancedFilters()), [])

  const count = useMemo(() => countAdvancedFilters(filters, activeSrc), [activeSrc, filters])
  const hasServerFilters = useMemo(() => hasServerAdvancedFilters(filters, activeSrc), [activeSrc, filters])
  const requestInput = useMemo(() => advancedFiltersToLoadInput(filters, activeSrc), [activeSrc, filters])
  const queryKey = useMemo(() => advancedFiltersQueryKey(filters, activeSrc), [activeSrc, filters])

  return {
    filters,
    setFilter,
    setArrayFilterValue,
    reset,
    count,
    hasServerFilters,
    requestInput,
    queryKey,
  }
}
