import { getLocation, getSimDetails, getSmsHistory, getStatusHistory } from "@/lib/api/sims"
import { requireCompanyUser } from "@/lib/auth/current-user"
import { MAX_ICCID_BATCH } from "@/lib/iccid"
import { isProvider } from "@/lib/subscriptions/filters"
import type {
  LocationActionResult,
  SimDetailsActionResult,
  SmsHistoryActionResult,
  StatusHistoryActionResult,
} from "@/lib/subscriptions/types"
import type { Provider } from "@/lib/types/api"
import { actionProblem } from "./errors"

export async function loadSimDetailsForInput(input: { iccids: string[]; providers?: Provider[] }): Promise<SimDetailsActionResult> {
  await requireCompanyUser()
  const iccids = Array.from(new Set(input.iccids.map((iccid) => iccid.trim()).filter(Boolean))).slice(0, MAX_ICCID_BATCH)
  const providers = input.providers?.filter(isProvider)

  try {
    return {
      ok: true,
      data: await getSimDetails({
        iccids,
        providers: providers?.length ? Array.from(new Set(providers)).sort() as Provider[] : undefined,
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudieron cargar los detalles") }
  }
}

export async function loadSmsHistoryForInput(input: {
  iccid: string
  startDate?: string
  endDate?: string
}): Promise<SmsHistoryActionResult> {
  await requireCompanyUser()
  try {
    return {
      ok: true,
      data: await getSmsHistory(input.iccid, {
        start_date: input.startDate,
        end_date: input.endDate,
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo cargar el historial SMS") }
  }
}

export async function loadStatusHistoryForInput(input: {
  iccid: string
  startDate?: string
  endDate?: string
}): Promise<StatusHistoryActionResult> {
  await requireCompanyUser()
  try {
    return {
      ok: true,
      data: await getStatusHistory(input.iccid, {
        start_date: input.startDate,
        end_date: input.endDate,
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo cargar el historial de estados") }
  }
}

export async function loadLocationForInput(input: { iccid: string }): Promise<LocationActionResult> {
  await requireCompanyUser()
  try {
    return { ok: true, data: await getLocation(input.iccid) }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudo cargar la ubicación") }
  }
}
