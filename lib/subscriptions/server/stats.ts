import { getAdminSimStats, getSimStats } from "@/lib/api/sims"
import { requireAdmin, requireCompanyUser } from "@/lib/auth/current-user"
import { customQueryParams, normalizeSubscriptionFilters, serviceFlag, staleLuTill } from "@/lib/subscriptions/filters"
import type { LoadSubscriptionsInput, SimStatsActionResult } from "@/lib/subscriptions/types"
import { actionProblem } from "./errors"

export async function loadSimStatsForInput(input: LoadSubscriptionsInput = {}): Promise<SimStatsActionResult> {
  const scope: "company" | "global" = input.scope === "global" ? "global" : "company"
  if (scope === "global") await requireAdmin()
  else await requireCompanyUser()

  try {
    const loadStats = scope === "global" ? getAdminSimStats : getSimStats
    const filters = normalizeSubscriptionFilters(input, { activeProviders: null, scope })
    return {
      ok: true,
      data: await loadStats({
        provider: filters.provider,
        status: filters.status,
        imei: filters.imei,
        operator: filters.operator,
        data_service: serviceFlag(filters.dataService),
        sms_service: serviceFlag(filters.smsService),
        last_lu_till: staleLuTill(filters.staleLuOnly),
        custom: customQueryParams(filters.provider, filters),
      }),
    }
  } catch (error) {
    return { ok: false, error: actionProblem(error, "No se pudieron cargar los KPIs") }
  }
}
