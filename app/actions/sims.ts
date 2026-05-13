"use server"

import { ApiError } from "@/lib/api-client"
import { importSims as importSimsApi } from "@/lib/api/sims"
import { requireCompanyUser } from "@/lib/auth/current-user"
import type { SimImportIn, SimImportOut } from "@/lib/types/api"

type ActionOk<T> = { ok: true; data: T }
type ActionErr = { ok: false; error: string; status?: number; code?: string; reason?: string }
export type SimActionResult<T> = ActionOk<T> | ActionErr

function toActionError(error: unknown): ActionErr {
  if (error instanceof ApiError) {
    const reason = typeof error.extra?.reason === "string" ? error.extra.reason : undefined
    return {
      ok: false,
      error: error.detail || error.message || "No se pudo completar la operación",
      status: error.status,
      code: error.code,
      reason,
    }
  }

  return {
    ok: false,
    error: error instanceof Error ? error.message : "No se pudo completar la operación",
  }
}

export async function importSims(body: SimImportIn): Promise<SimActionResult<SimImportOut>> {
  await requireCompanyUser()

  try {
    const data = await importSimsApi(body)
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}
