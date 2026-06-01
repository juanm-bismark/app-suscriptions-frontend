import { isIccid } from "@/lib/iccid"
import type { SearchField } from "@/lib/sim-identifiers"
import type { Provider } from "@/lib/types/api"
import {
  KITE_CUSTOM_FIELD_COUNT,
  TELE2_ACCOUNT_CUSTOM_COUNT,
  TELE2_CUSTOMER_CUSTOM_COUNT,
  TELE2_OPERATOR_CUSTOM_COUNT,
  isProvider,
  type SubscriptionAdvancedFilterInput,
  type SubscriptionFilterInput,
  type TristateFilter,
} from "./filter-types"

export interface NormalizedSubscriptionFilters extends Required<Omit<SubscriptionAdvancedFilterInput,
  | "imei"
  | "operator"
  | "kiteAlias"
  | "kiteCommercialGroup"
  | "kiteSupervisionGroup"
  | "kiteServicePack"
  | "tele2RatePlan"
  | "tele2CommunicationPlan"
  | "tele2AccountId"
  | "moabitsProductName"
  | "moabitsProductCode"
  | "moabitsCompanyCode"
  | "moabitsDataLimitMb"
  | "moabitsSmsLimit"
  | "moabitsCountry"
  | "moabitsRatType"
>> {
  scope?: "company" | "global"
  provider?: Provider
  status?: string
  statuses?: string
  cursor?: string
  q?: string
  searchField?: SearchField
  imei?: string
  operator?: string
  kiteAlias?: string
  kiteCommercialGroup?: string
  kiteSupervisionGroup?: string
  kiteServicePack?: string
  tele2RatePlan?: string
  tele2CommunicationPlan?: string
  tele2AccountId?: string
  moabitsProductName?: string
  moabitsProductCode?: string
  moabitsCompanyCode?: string
  moabitsDataLimitMb?: string
  moabitsSmsLimit?: string
  moabitsCountry?: string
  moabitsRatType?: string
}

export function normalizeSubscriptionFilters(
  input: SubscriptionFilterInput,
  options: { activeProviders?: readonly Provider[] | null; scope?: "company" | "global" } = {},
): NormalizedSubscriptionFilters {
  const scope = options.scope ?? (input.scope === "global" ? "global" : "company")
  const activeProviders = options.activeProviders

  return {
    scope,
    provider: isProvider(input.provider) && (activeProviders === null || activeProviders === undefined || activeProviders.includes(input.provider))
      ? input.provider
      : undefined,
    status: input.status?.trim() || undefined,
    statuses: input.statuses?.trim() || undefined,
    cursor: input.cursor,
    q: input.q?.trim() || undefined,
    searchField: input.searchField,
    imei: input.imei?.trim() || undefined,
    operator: input.operator?.trim() || undefined,
    dataService: input.dataService ?? "any",
    smsService: input.smsService ?? "any",
    staleLuOnly: Boolean(input.staleLuOnly),
    kiteAlias: input.kiteAlias?.trim() || undefined,
    kiteCommercialGroup: input.kiteCommercialGroup?.trim() || undefined,
    kiteSupervisionGroup: input.kiteSupervisionGroup?.trim() || undefined,
    kiteServicePack: input.kiteServicePack?.trim() || undefined,
    kiteCustomFields: input.kiteCustomFields ?? Array.from({ length: KITE_CUSTOM_FIELD_COUNT }, () => ""),
    tele2RatePlan: input.tele2RatePlan?.trim() || undefined,
    tele2CommunicationPlan: input.tele2CommunicationPlan?.trim() || undefined,
    tele2AccountId: input.tele2AccountId?.trim() || undefined,
    tele2AccountCustoms: input.tele2AccountCustoms ?? Array.from({ length: TELE2_ACCOUNT_CUSTOM_COUNT }, () => ""),
    tele2OperatorCustoms: input.tele2OperatorCustoms ?? Array.from({ length: TELE2_OPERATOR_CUSTOM_COUNT }, () => ""),
    tele2CustomerCustoms: input.tele2CustomerCustoms ?? Array.from({ length: TELE2_CUSTOMER_CUSTOM_COUNT }, () => ""),
    moabitsProductName: input.moabitsProductName?.trim() || undefined,
    moabitsProductCode: input.moabitsProductCode?.trim() || undefined,
    moabitsCompanyCode: input.moabitsCompanyCode?.trim() || undefined,
    moabitsAutorenewal: input.moabitsAutorenewal ?? "any",
    moabitsDataLimitMb: input.moabitsDataLimitMb?.trim() || undefined,
    moabitsSmsLimit: input.moabitsSmsLimit?.trim() || undefined,
    moabitsCountry: input.moabitsCountry?.trim() || undefined,
    moabitsRatType: input.moabitsRatType?.trim() || undefined,
  }
}

export function serviceFlag(value?: TristateFilter) {
  if (value === "on") return true
  if (value === "off") return false
  return undefined
}

export function staleLuTill(enabled?: boolean) {
  if (!enabled) return undefined
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z")
}

export function tele2DefaultModifiedSince() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z")
}

export function parseProviderStatusSelections(value: string | undefined, activeProviders: readonly Provider[]) {
  const active = new Set(activeProviders)
  const providers: Partial<Record<Provider, string[]>> = {}
  for (const raw of (value ?? "").split(",")) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const separator = trimmed.indexOf(":")
    if (separator <= 0) continue

    const provider = trimmed.slice(0, separator)
    const status = trimmed.slice(separator + 1).trim()
    if (!isProvider(provider) || !active.has(provider) || !status) continue
    providers[provider] = providers[provider] ?? []
    if (!providers[provider]?.includes(status)) providers[provider]?.push(status)
  }
  return Object.keys(providers).length ? providers : null
}

export function providerCustomFilters(provider: Provider, filters: SubscriptionAdvancedFilterInput) {
  const custom: Record<string, string> = {}
  if (provider === "kite") {
    addTextFilter(custom, "alias", filters.kiteAlias)
    addTextFilter(custom, "commercial_group", filters.kiteCommercialGroup)
    addTextFilter(custom, "supervision_group", filters.kiteSupervisionGroup)
    addTextFilter(custom, "service_pack", filters.kiteServicePack)
    addIndexedTextFilters(custom, "customField", filters.kiteCustomFields)
  }
  if (provider === "tele2") {
    addTextFilter(custom, "rate_plan", filters.tele2RatePlan)
    addTextFilter(custom, "communication_plan", filters.tele2CommunicationPlan)
    addTextFilter(custom, "account_id", filters.tele2AccountId)
    addIndexedTextFilters(custom, "accountCustom", filters.tele2AccountCustoms)
    addIndexedTextFilters(custom, "operatorCustom", filters.tele2OperatorCustoms)
    addIndexedTextFilters(custom, "customerCustom", filters.tele2CustomerCustoms)
  }
  if (provider === "moabits") {
    addTextFilter(custom, "product_name", filters.moabitsProductName)
    addTextFilter(custom, "product_code", filters.moabitsProductCode)
    addTextFilter(custom, "company_code", filters.moabitsCompanyCode)
    addTristateFilter(custom, "autorenewal", filters.moabitsAutorenewal)
    addTextFilter(custom, "data_limit_mb", filters.moabitsDataLimitMb)
    addTextFilter(custom, "sms_limit", filters.moabitsSmsLimit)
    addTextFilter(custom, "country", filters.moabitsCountry)
    addTextFilter(custom, "rat_type", filters.moabitsRatType)
  }
  return custom
}

export function customQueryParams(provider: Provider | undefined, filters: SubscriptionAdvancedFilterInput) {
  if (!provider) return undefined
  const custom = providerCustomFilters(provider, filters)
  const entries = Object.entries(custom)
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`) : undefined
}

export function hasServerSubscriptionFilters(filters: SubscriptionAdvancedFilterInput) {
  return Boolean(
    filters.imei?.trim() ||
    filters.operator?.trim() ||
    filters.dataService !== "any" ||
    filters.smsService !== "any" ||
    filters.staleLuOnly ||
    filters.kiteAlias?.trim() ||
    filters.kiteCommercialGroup?.trim() ||
    filters.kiteSupervisionGroup?.trim() ||
    filters.kiteServicePack?.trim() ||
    filters.kiteCustomFields?.some((value) => value.trim()) ||
    filters.tele2RatePlan?.trim() ||
    filters.tele2CommunicationPlan?.trim() ||
    filters.tele2AccountId?.trim() ||
    filters.tele2AccountCustoms?.some((value) => value.trim()) ||
    filters.tele2OperatorCustoms?.some((value) => value.trim()) ||
    filters.tele2CustomerCustoms?.some((value) => value.trim()) ||
    filters.moabitsProductName?.trim() ||
    filters.moabitsProductCode?.trim() ||
    filters.moabitsCompanyCode?.trim() ||
    filters.moabitsAutorenewal !== "any" ||
    filters.moabitsDataLimitMb?.trim() ||
    filters.moabitsSmsLimit?.trim() ||
    filters.moabitsCountry?.trim() ||
    filters.moabitsRatType?.trim()
  )
}

export function applySearchParam<T extends Partial<Record<SearchField, string>>>(
  apiParams: T,
  query: string | undefined,
  searchField?: SearchField,
) {
  const normalized = query?.trim()
  if (!normalized) return

  if (searchField === "iccid" || searchField === "imsi" || searchField === "msisdn") {
    apiParams[searchField] = normalized
    return
  }

  if (isIccid(normalized)) {
    apiParams.iccid = normalized
  }
}

function addTextFilter(target: Record<string, string>, key: string, value: string | undefined) {
  const trimmed = value?.trim()
  if (trimmed) target[key] = trimmed
}

function addIndexedTextFilters(target: Record<string, string>, prefix: string, values: string[] | undefined) {
  values?.forEach((value, index) => addTextFilter(target, `${prefix}${index + 1}`, value))
}

function addTristateFilter(target: Record<string, string>, key: string, value?: TristateFilter) {
  if (value === "on") target[key] = "true"
  if (value === "off") target[key] = "false"
}
