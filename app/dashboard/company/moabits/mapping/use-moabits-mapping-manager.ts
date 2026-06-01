"use client"

import { useEffect, useMemo, useState } from "react"
import {
  deleteMoabitsProviderMapping,
  discoverMoabitsProviderMappings,
  upsertMoabitsProviderMapping,
} from "@/app/actions/company"
import { getClientActionErrorMessage } from "@/lib/client-action-error"
import type { Page } from "@/lib/types/user"
import type {
  LocalCompanyMoabitsMappingOut,
  MoabitsCompanyOut,
  MoabitsProviderMappingDiscoveryOut,
} from "@/lib/types/api"
import { EMPTY_DRAFT } from "./constants"
import {
  loadAllMappingsFromDb,
  loadMappingManagerSnapshot,
  loadMoabitsSourceCompaniesFromCache,
} from "./data"
import type { Draft, EditorMode, MappingPageInfo } from "./types"
import {
  buildLocalCompanySearchOptions,
  buildMoabitsOptions,
  buildMoabitsSearchOptions,
  findMappedCompany,
  findMoabitsOption,
  mergeMappings,
  namesAreEqual,
  withSelectedMoabitsOption,
} from "./utils"

export function useMoabitsMappingManager({
  initialPage,
  currentPage,
  pageSize,
  query,
}: {
  initialPage: Page<LocalCompanyMoabitsMappingOut>
  currentPage: number
  pageSize: number
  query: string
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
  const [editing, setEditing] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [loadingDb, setLoadingDb] = useState(false)
  const [loadingDiscovery, setLoadingDiscovery] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  const linkedCount = pageInfo.total ?? linkedRows.length
  const localCompanyOptions = useMemo(() => buildLocalCompanySearchOptions(allMappings), [allMappings])
  const moabitsOptions = useMemo(
    () =>
      buildMoabitsOptions({
        liveCompanies: discovery?.moabits_companies ?? null,
        cachedCompanies: cachedMoabitsCompanies,
        mappings: allMappings,
      }),
    [discovery, cachedMoabitsCompanies, allMappings],
  )
  const baseMoabitsSearchOptions = useMemo(() => buildMoabitsSearchOptions(moabitsOptions), [moabitsOptions])
  const moabitsSearchOptions = useMemo(
    () => withSelectedMoabitsOption(baseMoabitsSearchOptions, draft),
    [baseMoabitsSearchOptions, draft],
  )

  const selectedLocalCompany = findMappedCompany(allMappings, draft.companyId)
  const selectedMoabitsCompany = findMoabitsOption(moabitsOptions, draft.companyCode)
  const selectedMoabitsTitle =
    selectedMoabitsCompany?.companyName || draft.companyName || (draft.companyCode ? draft.companyCode : "Sin seleccionar")
  const selectedMoabitsDetail =
    selectedMoabitsCompany?.companyCode || draft.companyCode || "Selecciona una empresa Moabits"
  const selectedMapping = selectedLocalCompany?.mapping ?? null
  const linkedElsewhere = allMappings.filter(
    (item) => item.company_id !== draft.companyId && item.mapping?.companyCode === draft.companyCode,
  )
  const namesMatch = namesAreEqual(selectedLocalCompany?.company_name, selectedMoabitsCompany?.companyName)
  const moabitsOptionSource = discovery ? "Moabits en vivo" : "Cache Moabits"

  function clearMessages() {
    setError(null)
    setSuccess(null)
  }

  function closeEditor() {
    setEditing(false)
    setEditorMode(null)
    setDraft(EMPTY_DRAFT)
    setError(null)
  }

  function startCreate() {
    clearMessages()
    setEditorMode("create")
    setEditing(true)
    setDraft(EMPTY_DRAFT)
  }

  function setDraftFromLocal(companyOrId: string | LocalCompanyMoabitsMappingOut) {
    const companyId = typeof companyOrId === "string" ? companyOrId : companyOrId.company_id
    const localCompany = typeof companyOrId === "string" ? findMappedCompany(allMappings, companyId) : companyOrId
    const mapping = localCompany?.mapping ?? null

    setDraft({
      companyId,
      companyCode: mapping?.companyCode ?? "",
      companyName: mapping?.companyName ?? "",
      clieId: mapping?.clie_id != null ? String(mapping.clie_id) : "",
    })
  }

  function startEdit(row: LocalCompanyMoabitsMappingOut) {
    const company = findMappedCompany(allMappings, row.company_id) ?? row
    if (!company) {
      setError("No se encontro la empresa en los datos cargados desde BD.")
      return
    }

    setAllMappings((current) => mergeMappings(current, [company]))
    setEditing(true)
    setEditorMode("edit")
    clearMessages()
    setDraftFromLocal(company)
  }

  function selectLocalCompany(companyId: string) {
    setDraftFromLocal(companyId)
    clearMessages()
  }

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function applyMoabitsCompany(companyCode: string) {
    const company = findMoabitsOption(moabitsOptions, companyCode)
    setDraft((current) => ({
      ...current,
      companyCode,
      companyName: company?.companyName ?? current.companyName,
      clieId: company?.clie_id != null ? String(company.clie_id) : "",
    }))
    clearMessages()
  }

  async function refreshDiscoveryOnly() {
    setLoadingDiscovery(true)
    clearMessages()

    try {
      const result = await discoverMoabitsProviderMappings()
      if (result.success !== true) {
        setError(result.error ?? "No se pudo actualizar el descubrimiento Moabits.")
        return null
      }

      setDiscovery(result.data)
      setCachedMoabitsCompanies(result.data.moabits_companies)
      setAllMappings((current) => mergeMappings(current, result.data.local_companies))
      setSuccess("Consulta de Moabits finalizada. La cache de companias Moabits fue actualizada.")
      return result.data
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo actualizar el descubrimiento Moabits."))
      return null
    } finally {
      setLoadingDiscovery(false)
    }
  }

  async function refreshFromDb({ showSuccess = true }: { showSuccess?: boolean } = {}) {
    setLoadingDb(true)
    setError(null)
    if (showSuccess) setSuccess(null)

    try {
      const result = await loadMappingManagerSnapshot({ page: currentPage, size: pageSize, query })
      if (result.success !== true) {
        setError(result.error)
        return null
      }

      setLinkedRows(result.data.linkedRows)
      setPageInfo(result.data.pageInfo)
      setAllMappings(result.data.allMappings)
      setCachedMoabitsCompanies(result.data.cachedMoabitsCompanies)
      setDiscovery(null)

      if (showSuccess) setSuccess("Cache de companias y vinculaciones actualizadas desde BD.")
      return result.data.linkedRows
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo consultar la cache de companias desde BD."))
      return null
    } finally {
      setLoadingDb(false)
    }
  }

  async function saveMapping() {
    const cleanCompanyId = draft.companyId.trim()
    const cleanCode = draft.companyCode.trim()
    const cleanName = draft.companyName.trim()
    const cleanClieId = draft.clieId.trim()

    if (!cleanCompanyId) {
      setError("Selecciona una empresa de la BD.")
      return
    }

    if (!cleanCode) {
      setError("Selecciona o ingresa el codigo de compania Moabits.")
      return
    }

    if (cleanClieId && !Number.isInteger(Number(cleanClieId))) {
      setError("clie_id debe ser un numero entero.")
      return
    }

    setSaving(true)
    clearMessages()

    try {
      const result = await upsertMoabitsProviderMapping(cleanCompanyId, {
        companyCode: cleanCode,
        companyName: cleanName || null,
        clie_id: cleanClieId ? Number(cleanClieId) : null,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const refreshed = await refreshFromDb({ showSuccess: false })
      if (!refreshed) return
      setSuccess(
        editorMode === "create"
          ? "Vinculacion Moabits creada para esta empresa."
          : "Vinculacion Moabits actualizada para esta empresa.",
      )
      if (editorMode === "create") {
        setEditing(false)
        setEditorMode(null)
        setDraft(EMPTY_DRAFT)
      }
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo guardar la vinculacion Moabits."))
    } finally {
      setSaving(false)
    }
  }

  async function removeMappingById(companyId: string) {
    setConfirmingId(null)
    setDeletingId(companyId)
    clearMessages()

    try {
      const result = await deleteMoabitsProviderMapping(companyId)
      if (result.error) {
        setError(result.error)
        return
      }

      const refreshed = await refreshFromDb({ showSuccess: false })
      if (!refreshed) return
      if (editing && draft.companyId === companyId) {
        setEditing(false)
        setEditorMode(null)
      }
      setSuccess("Vinculacion Moabits eliminada para esta empresa.")
    } catch (error) {
      setError(getClientActionErrorMessage(error, "No se pudo quitar la vinculacion Moabits."))
    } finally {
      setDeletingId(null)
    }
  }

  return {
    allMappings,
    applyMoabitsCompany,
    cachedMoabitsCompanies,
    closeEditor,
    confirmingId,
    deletingId,
    discovery,
    draft,
    editing,
    editorMode,
    error,
    linkedCount,
    linkedElsewhere,
    linkedRows,
    loadingDb,
    loadingDiscovery,
    localCompanyOptions,
    moabitsOptionSource,
    moabitsOptions,
    moabitsSearchOptions,
    namesMatch,
    pageInfo,
    refreshDiscoveryOnly,
    refreshFromDb,
    removeMappingById,
    saveMapping,
    saving,
    selectLocalCompany,
    selectedLocalCompany,
    selectedMapping,
    selectedMoabitsCompany,
    selectedMoabitsDetail,
    selectedMoabitsTitle,
    setConfirmingId,
    startCreate,
    startEdit,
    success,
    updateDraft,
  }
}

