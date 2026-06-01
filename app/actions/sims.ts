"use server"

import { importSims as importSimsApi } from "@/lib/api/sims"
import { toActionError, type ActionResult } from "@/lib/actions/errors"
import { requireCompanyUser } from "@/lib/auth/current-user"
import type { SimImportIn, SimImportOut } from "@/lib/types/api"

export type SimActionResult<T> = ActionResult<T>

export async function importSims(body: SimImportIn): Promise<SimActionResult<SimImportOut>> {
  await requireCompanyUser()

  try {
    const data = await importSimsApi(body)
    return { ok: true, data }
  } catch (error) {
    return toActionError(error)
  }
}
