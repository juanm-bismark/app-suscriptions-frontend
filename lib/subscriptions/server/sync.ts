import { getJob, getSyncStatus, triggerSync } from "@/lib/api/sims"
import { requireAdmin, requireCompanyUser } from "@/lib/auth/current-user"
import type { JobActionResult, SyncStatusActionResult, SyncTriggerActionResult } from "@/lib/subscriptions/types"
import type { Provider } from "@/lib/types/api"
import { actionProblem } from "./errors"

export async function loadSyncStatusForInput(): Promise<SyncStatusActionResult> {
  await requireCompanyUser()
  try {
    return { ok: true, data: await getSyncStatus() }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo consultar la sincronización") }
  }
}

export async function triggerRoutingSyncForProvider(provider: Provider): Promise<SyncTriggerActionResult> {
  await requireAdmin()
  try {
    return { ok: true, data: await triggerSync(provider) }
  } catch (error) {
    const problem = actionProblem(error, "No se pudo iniciar la sincronización")
    if (problem.status === 409 && problem.code === "sync.already_running") {
      return { ok: false, alreadyRunning: true, error: problem }
    }
    return { ok: false, alreadyRunning: false, error: problem }
  }
}

export async function loadJobForId(jobId: string): Promise<JobActionResult> {
  await requireCompanyUser()
  try {
    return { ok: true, data: await getJob(jobId) }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo consultar el job") }
  }
}
