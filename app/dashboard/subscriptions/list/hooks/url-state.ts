"use client"

import type { LoadSubscriptionsData } from "@/lib/subscriptions/types"
import { MAX_ICCID_BATCH, parseIccidList } from "@/lib/iccid"
import { isSearchField, type SearchMode } from "@/lib/sim-identifiers"
import { positiveInt } from "@/lib/utils"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { getEffectiveSource, sanitizeProviderIds, type SourceFilter } from "../../filters/source-filter"
import {
  isKnownNativeStatus,
  normalizeStatusValue,
  parseStatusSelections,
  serializeStatusSelections,
  type NativeStatusSelections,
} from "../../filters/status-filter"
import type { SourceId } from "../../tokens"
import { dropPaginationParams, pageSizeFrom, parseCursorStack, setParam } from "../url"
import type { StatusFilter, ViewScope } from "../types"

export function useSubscriptionsUrlState({
  filters,
  initialSource,
  activeProviders,
  viewScope,
  isAdmin,
  hasCompanyScope,
}: {
  filters: LoadSubscriptionsData["filters"]
  initialSource: SourceFilter
  activeProviders: SourceId[] | null
  viewScope: ViewScope
  isAdmin: boolean
  hasCompanyScope: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeProviderIds = useMemo(() => sanitizeProviderIds(activeProviders), [activeProviders])
  const filterQ = filters?.q ?? ""
  const filterSearchMode: SearchMode = isSearchField(filters?.searchField) ? filters.searchField : "auto"
  const filterStatuses = filters.statuses
  const filterStatus =
    initialSource !== "all" && activeProviderIds.includes(initialSource) && isKnownNativeStatus(initialSource, filters?.status)
      ? normalizeStatusValue(filters?.status)
      : "all"
  const initialStatusSelections = useMemo(
    () => (initialSource === "all" ? parseStatusSelections(filterStatuses, activeProviderIds) : {}),
    [activeProviderIds, filterStatuses, initialSource],
  )
  const [draftQ, setDraftQ] = useState(filterQ)
  const [q, setQ] = useState(filterQ)
  const [activeSearchMode, setActiveSearchMode] = useState<SearchMode>(filterSearchMode)
  const [activeSrc, setActiveSrc] = useState<SourceFilter>(initialSource)
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(filterStatus)
  const [statusSelections, setStatusSelections] = useState<NativeStatusSelections>(initialStatusSelections)
  const currentPageSize = pageSizeFrom(searchParams.get("size"))
  const cursorStack = useMemo(() => parseCursorStack(searchParams.get("cursor_stack")), [searchParams])
  const page = positiveInt(searchParams.get("page"), filters.cursor ? cursorStack.length + 1 : 1)
  const iccidList = useMemo(
    () => activeSearchMode === "auto" || activeSearchMode === "iccid" ? parseIccidList(draftQ, MAX_ICCID_BATCH) : [],
    [activeSearchMode, draftQ],
  )
  const isMultiIccid = iccidList.length > 1

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    const currentFilters = new URLSearchParams(searchParams)
    dropPaginationParams(currentFilters)

    setParam(params, "provider", activeSrc === "all" ? null : activeSrc)
    setParam(params, "status", activeSrc !== "all" && activeStatus !== "all" ? activeStatus : null)
    setParam(params, "statuses", activeSrc === "all" ? serializeStatusSelections(statusSelections, activeProviderIds) : null)
    setParam(params, "q", q.trim() || null)
    setParam(params, "searchField", activeSearchMode === "auto" ? null : activeSearchMode)
    setParam(params, "scope", viewScope === "global" ? "global" : null)

    const nextFilters = new URLSearchParams(params)
    dropPaginationParams(nextFilters)
    if (nextFilters.toString() !== currentFilters.toString()) dropPaginationParams(params)

    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false })
  }, [activeProviderIds, activeSearchMode, activeSrc, activeStatus, pathname, q, router, searchParams, statusSelections, viewScope])

  function commitSearch() {
    setQ(draftQ.trim())
  }

  function clearSearch() {
    setDraftQ("")
    setQ("")
  }

  function changeSource(source: SourceFilter) {
    setActiveSrc(source)
    setActiveStatus("all")
    setStatusSelections({})
  }

  function switchViewScope(nextScope: ViewScope) {
    if (!isAdmin || (nextScope === "company" && !hasCompanyScope)) return
    const params = new URLSearchParams(searchParams)
    setParam(params, "scope", nextScope === "global" ? "global" : null)
    dropPaginationParams(params)
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
  }

  return {
    activeProviderIds,
    activeSearchMode,
    activeSrc,
    activeStatus,
    changeSource,
    clearSearch,
    commitSearch,
    currentPageSize,
    cursorStack,
    draftQ,
    iccidList,
    isMultiIccid,
    page,
    pathname,
    q,
    searchParams,
    setActiveSearchMode,
    setActiveStatus,
    setDraftQ,
    setStatusSelections,
    statusSelections,
    switchViewScope,
  }
}

export function initialSourceFromFilters(filters: LoadSubscriptionFiltersLike, activeProviderIds: SourceId[]) {
  return getEffectiveSource(filters.provider, activeProviderIds)
}

type LoadSubscriptionFiltersLike = {
  provider?: string
}
