import type { LocalCompanyMoabitsMappingOut } from "@/lib/types/api"
import { EMPTY_DRAFT } from "./constants"
import type { Draft, EditorMode } from "./types"

export type ValidMappingDraft = {
  companyId: string
  companyCode: string
  companyName: string | null
  clieId: number | null
}

export function draftFromLocalCompany(
  companyId: string,
  company?: LocalCompanyMoabitsMappingOut | null,
): Draft {
  const mapping = company?.mapping ?? null

  return {
    companyId,
    companyCode: mapping?.companyCode ?? EMPTY_DRAFT.companyCode,
    companyName: mapping?.companyName ?? EMPTY_DRAFT.companyName,
    clieId: mapping?.clie_id != null ? String(mapping.clie_id) : EMPTY_DRAFT.clieId,
  }
}

export function validateMappingDraft(draft: Draft):
  | { success: true; data: ValidMappingDraft }
  | { success: false; error: string } {
  const companyId = draft.companyId.trim()
  const companyCode = draft.companyCode.trim()
  const companyName = draft.companyName.trim()
  const clieId = draft.clieId.trim()

  if (!companyId) {
    return { success: false, error: "Selecciona una empresa de la BD." }
  }

  if (!companyCode) {
    return { success: false, error: "Selecciona o ingresa el codigo de compania Moabits." }
  }

  if (clieId && !Number.isInteger(Number(clieId))) {
    return { success: false, error: "clie_id debe ser un numero entero." }
  }

  return {
    success: true,
    data: {
      companyId,
      companyCode,
      companyName: companyName || null,
      clieId: clieId ? Number(clieId) : null,
    },
  }
}

export function savedMappingMessage(mode: EditorMode | null) {
  return mode === "create"
    ? "Vinculacion Moabits creada para esta empresa."
    : "Vinculacion Moabits actualizada para esta empresa."
}
