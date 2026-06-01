"use client"

import { useState } from "react"
import {
  deleteMoabitsProviderMapping,
  upsertMoabitsProviderMapping,
} from "@/app/actions/company"
import { getClientActionErrorMessage } from "@/lib/client-action-error"
import type { Page } from "@/lib/types/user"
import type { LocalCompanyMoabitsMappingOut } from "@/lib/types/api"
import { EMPTY_DRAFT } from "./constants"
import { draftFromLocalCompany, savedMappingMessage, validateMappingDraft } from "./draft"
import type { Draft, EditorMode } from "./types"
import { useMoabitsMappingData } from "./use-moabits-mapping-data"
import { useMoabitsMappingOptions } from "./use-moabits-mapping-options"
import { findMappedCompany, findMoabitsOption, mergeMappings } from "./utils"

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
  const [editing, setEditing] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const {
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
  } = useMoabitsMappingData({
    initialPage,
    currentPage,
    pageSize,
    query,
    clearMessages,
    onError: setError,
    onSuccess: setSuccess,
  })
  const mappingOptions = useMoabitsMappingOptions({
    allMappings,
    cachedMoabitsCompanies,
    discovery,
    draft,
  })
  const linkedCount = pageInfo.total ?? linkedRows.length

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
    setDraft(draftFromLocalCompany(companyId, localCompany))
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
    const company = findMoabitsOption(mappingOptions.moabitsOptions, companyCode)
    setDraft((current) => ({
      ...current,
      companyCode,
      companyName: company?.companyName ?? current.companyName,
      clieId: company?.clie_id != null ? String(company.clie_id) : "",
    }))
    clearMessages()
  }

  async function saveMapping() {
    const validation = validateMappingDraft(draft)
    if (validation.success !== true) {
      setError(validation.error)
      return
    }

    setSaving(true)
    clearMessages()

    try {
      const result = await upsertMoabitsProviderMapping(validation.data.companyId, {
        companyCode: validation.data.companyCode,
        companyName: validation.data.companyName,
        clie_id: validation.data.clieId,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const refreshed = await refreshFromDb({ showSuccess: false })
      if (!refreshed) return
      setSuccess(savedMappingMessage(editorMode))
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
    linkedElsewhere: mappingOptions.linkedElsewhere,
    linkedRows,
    loadingDb,
    loadingDiscovery,
    localCompanyOptions: mappingOptions.localCompanyOptions,
    moabitsOptionSource: mappingOptions.moabitsOptionSource,
    moabitsOptions: mappingOptions.moabitsOptions,
    moabitsSearchOptions: mappingOptions.moabitsSearchOptions,
    namesMatch: mappingOptions.namesMatch,
    pageInfo,
    refreshDiscoveryOnly,
    refreshFromDb,
    removeMappingById,
    saveMapping,
    saving,
    selectLocalCompany,
    selectedLocalCompany: mappingOptions.selectedLocalCompany,
    selectedMapping: mappingOptions.selectedMapping,
    selectedMoabitsCompany: mappingOptions.selectedMoabitsCompany,
    selectedMoabitsDetail: mappingOptions.selectedMoabitsDetail,
    selectedMoabitsTitle: mappingOptions.selectedMoabitsTitle,
    setConfirmingId,
    startCreate,
    startEdit,
    success,
    updateDraft,
  }
}
