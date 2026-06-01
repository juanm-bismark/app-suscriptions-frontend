"use client"

import { useEffect, useState } from "react"
import { discoverMoabitsProviderMappings } from "@/app/actions/company"
import { getClientActionErrorMessage } from "@/lib/client-action-error"
import type { Page } from "@/lib/types/user"
import type {
  LocalCompanyMoabitsMappingOut,
  MoabitsCompanyOut,
  MoabitsProviderMappingDiscoveryOut,
} from "@/lib/types/api"
import {
  loadAllMappingsFromDb,
  loadMappingManagerSnapshot,
  loadMoabitsSourceCompaniesFromCache,
} from "./data"
import type { MappingPageInfo } from "./types"
import { mergeMappings } from "./utils"

export function useMoabitsMappingData({
  initialPage,
  currentPage,
  pageSize,
  query,
  clearMessages,
  onError,
  onSuccess,
}: {
  initialPage: Page<LocalCompanyMoabitsMappingOut>
  currentPage: number
  pageSize: number
  query: string
  clearMessages: () => void
  onError: (message: string | null) => void
  onSuccess: (message: string | null) => void
}) {
  const [linkedRows, setLinkedRows] = useState(initialPage.items)
  const [pageInfo, setPageInfo] = useState<MappingPageInfo>({
    page: initialPage.page,
    pages: initialPage.pages,
    size: initialPage.size,
    total: initialPage.total,
  })
  const [allMappings, setAllMappings] = useState<LocalCompanyMoabitsMappingOut[]>(initialPage.items)
  const [cachedMoabitsCompanies, setCachedMoabitsCompanies] = useState<MoabitsCompanyOut[]>([])
  const [discovery, setDiscovery] = useState<MoabitsProviderMappingDiscoveryOut | null>(null)
  const [loadingDb, setLoadingDb] = useState(false)
  const [loadingDiscovery, setLoadingDiscovery] = useState(false)

  useEffect(() => {
    let cancelled = false

    void loadAllMappingsFromDb().then((result) => {
      if (!cancelled && result.success) {
        setAllMappings((current) => mergeMappings(current, result.data))
      }
    })
    void loadMoabitsSourceCompaniesFromCache().then((result) => {
      if (!cancelled && result.success) {
        setCachedMoabitsCompanies(result.data)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function refreshDiscoveryOnly() {
    setLoadingDiscovery(true)
    clearMessages()

    try {
      const result = await discoverMoabitsProviderMappings()
      if (result.success !== true) {
        onError(result.error ?? "No se pudo actualizar el descubrimiento Moabits.")
        return null
      }

      setDiscovery(result.data)
      setCachedMoabitsCompanies(result.data.moabits_companies)
      setAllMappings((current) => mergeMappings(current, result.data.local_companies))
      onSuccess("Consulta de Moabits finalizada. La cache de companias Moabits fue actualizada.")
      return result.data
    } catch (error) {
      onError(getClientActionErrorMessage(error, "No se pudo actualizar el descubrimiento Moabits."))
      return null
    } finally {
      setLoadingDiscovery(false)
    }
  }

  async function refreshFromDb({ showSuccess = true }: { showSuccess?: boolean } = {}) {
    setLoadingDb(true)
    onError(null)
    if (showSuccess) onSuccess(null)

    try {
      const result = await loadMappingManagerSnapshot({ page: currentPage, size: pageSize, query })
      if (result.success !== true) {
        onError(result.error)
        return null
      }

      setLinkedRows(result.data.linkedRows)
      setPageInfo(result.data.pageInfo)
      setAllMappings(result.data.allMappings)
      setCachedMoabitsCompanies(result.data.cachedMoabitsCompanies)
      setDiscovery(null)

      if (showSuccess) onSuccess("Cache de companias y vinculaciones actualizadas desde BD.")
      return result.data.linkedRows
    } catch (error) {
      onError(getClientActionErrorMessage(error, "No se pudo consultar la cache de companias desde BD."))
      return null
    } finally {
      setLoadingDb(false)
    }
  }

  return {
    allMappings,
    cachedMoabitsCompanies,
    discovery,
    linkedRows,
    loadingDb,
    loadingDiscovery,
    pageInfo,
    refreshDiscoveryOnly,
    refreshFromDb,
    setAllMappings,
  }
}
