import { isIccid } from "@/lib/iccid"
import {
  hasServerSubscriptionFilters,
  parseProviderStatusSelections,
  providerCustomFilters,
  serviceFlag,
  staleLuTill,
  tele2DefaultModifiedSince,
  type NormalizedSubscriptionFilters,
} from "@/lib/subscriptions/filters"
import type { SimSearchIn, Provider } from "@/lib/types/api"

export function buildSearchBody(
  filters: NormalizedSubscriptionFilters,
  limit: number,
  activeProviders: readonly Provider[],
): SimSearchIn | null {
  const statusSelections = parseProviderStatusSelections(filters.statuses, activeProviders)
  const useAdvanced = hasServerSubscriptionFilters(filters)
  const query = filters.q?.trim()
  const hasIdentifierSearch = Boolean(query && (filters.searchField || isIccid(query)))
  if (!statusSelections && !useAdvanced && !hasIdentifierSearch) return null

  const common: NonNullable<SimSearchIn["common"]> = {}
  if (query && filters.searchField) {
    common[filters.searchField] = query
  } else if (query && isIccid(query)) {
    common.iccid = query
  }
  if (filters.imei?.trim()) common.imei = filters.imei.trim()
  if (filters.operator?.trim()) common.operator = filters.operator.trim()
  common.data_service = serviceFlag(filters.dataService)
  common.sms_service = serviceFlag(filters.smsService)
  common.last_lu_till = staleLuTill(filters.staleLuOnly)

  if ((statusSelections?.tele2 || useAdvanced || hasIdentifierSearch) && !filters.cursor) {
    common.modified_since = tele2DefaultModifiedSince()
  }

  const providers: NonNullable<SimSearchIn["providers"]> = {}
  for (const provider of activeProviders) {
    const statuses = statusSelections?.[provider] ?? []
    const custom = providerCustomFilters(provider, filters)
    const providerBody: NonNullable<SimSearchIn["providers"]>[Provider] = {}
    if (statuses.length === 1) providerBody.status = statuses[0]
    else if (statuses.length > 1) providerBody.statuses = statuses
    const hasCustom = Object.keys(custom).length > 0
    if (hasCustom) providerBody.custom = custom
    if (statuses.length > 0 || useAdvanced || hasCustom || hasIdentifierSearch) providers[provider] = providerBody
  }

  if (Object.keys(providers).length === 0) return null

  return {
    limit,
    cursor: filters.cursor ?? null,
    common: Object.keys(common).length ? common : null,
    providers,
  }
}
