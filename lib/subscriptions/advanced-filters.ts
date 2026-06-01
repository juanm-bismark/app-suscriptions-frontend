import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import {
  KITE_CUSTOM_FIELD_COUNT,
  TELE2_ACCOUNT_CUSTOM_COUNT,
  TELE2_CUSTOMER_CUSTOM_COUNT,
  TELE2_OPERATOR_CUSTOM_COUNT,
  type AdvancedFiltersLoadInput,
  type AdvancedSubscriptionFilters,
  type SourceFilter,
} from "./filter-types"

export function createEmptyAdvancedFilters(): AdvancedSubscriptionFilters {
  return {
    sourceIds: null,
    plan: "",
    client: "",
    imei: "",
    operator: "",
    dataService: "any",
    smsService: "any",
    staleLuOnly: false,
    kiteAlias: "",
    kiteCommercialGroup: "",
    kiteSupervisionGroup: "",
    kiteServicePack: "",
    kiteCustomFields: Array.from({ length: KITE_CUSTOM_FIELD_COUNT }, () => ""),
    tele2RatePlan: "",
    tele2CommunicationPlan: "",
    tele2AccountId: "",
    tele2AccountCustoms: Array.from({ length: TELE2_ACCOUNT_CUSTOM_COUNT }, () => ""),
    tele2OperatorCustoms: Array.from({ length: TELE2_OPERATOR_CUSTOM_COUNT }, () => ""),
    tele2CustomerCustoms: Array.from({ length: TELE2_CUSTOMER_CUSTOM_COUNT }, () => ""),
    moabitsProductName: "",
    moabitsProductCode: "",
    moabitsCompanyCode: "",
    moabitsAutorenewal: "any",
    moabitsDataLimitMb: "",
    moabitsSmsLimit: "",
    moabitsCountry: "",
    moabitsRatType: "",
  }
}

export function hasServerAdvancedFilters(filters: AdvancedSubscriptionFilters, activeSrc: SourceFilter) {
  return Boolean(
    filters.imei.trim() ||
    filters.operator.trim() ||
    filters.dataService !== "any" ||
    filters.smsService !== "any" ||
    filters.staleLuOnly ||
    providerFilterCount(filters, activeSrc) > 0
  )
}

export function countAdvancedFilters(filters: AdvancedSubscriptionFilters, activeSrc: SourceFilter) {
  return (
    (filters.sourceIds && filters.sourceIds.size > 0 ? 1 : 0) +
    (filters.plan.trim() ? 1 : 0) +
    (filters.client.trim() ? 1 : 0) +
    (filters.imei.trim() ? 1 : 0) +
    (filters.operator.trim() ? 1 : 0) +
    (filters.dataService !== "any" ? 1 : 0) +
    (filters.smsService !== "any" ? 1 : 0) +
    (filters.staleLuOnly ? 1 : 0) +
    providerFilterCount(filters, activeSrc)
  )
}

export function advancedFiltersToLoadInput(
  filters: AdvancedSubscriptionFilters,
  activeSrc: SourceFilter,
): Partial<AdvancedFiltersLoadInput> {
  return {
    imei: filters.imei,
    operator: filters.operator,
    dataService: filters.dataService,
    smsService: filters.smsService,
    staleLuOnly: filters.staleLuOnly,
    ...(activeSrc === "kite" ? {
      kiteAlias: filters.kiteAlias,
      kiteCommercialGroup: filters.kiteCommercialGroup,
      kiteSupervisionGroup: filters.kiteSupervisionGroup,
      kiteServicePack: filters.kiteServicePack,
      kiteCustomFields: filters.kiteCustomFields,
    } : {}),
    ...(activeSrc === "tele2" ? {
      tele2RatePlan: filters.tele2RatePlan,
      tele2CommunicationPlan: filters.tele2CommunicationPlan,
      tele2AccountId: filters.tele2AccountId,
      tele2AccountCustoms: filters.tele2AccountCustoms,
      tele2OperatorCustoms: filters.tele2OperatorCustoms,
      tele2CustomerCustoms: filters.tele2CustomerCustoms,
    } : {}),
    ...(activeSrc === "moabits" ? {
      moabitsProductName: filters.moabitsProductName,
      moabitsProductCode: filters.moabitsProductCode,
      moabitsCompanyCode: filters.moabitsCompanyCode,
      moabitsAutorenewal: filters.moabitsAutorenewal,
      moabitsDataLimitMb: filters.moabitsDataLimitMb,
      moabitsSmsLimit: filters.moabitsSmsLimit,
      moabitsCountry: filters.moabitsCountry,
      moabitsRatType: filters.moabitsRatType,
    } : {}),
  }
}

export function advancedFiltersQueryKey(filters: AdvancedSubscriptionFilters, activeSrc: SourceFilter) {
  return {
    activeSrc,
    imei: filters.imei.trim(),
    operator: filters.operator.trim(),
    dataService: filters.dataService,
    smsService: filters.smsService,
    staleLuOnly: filters.staleLuOnly,
    ...providerQueryKey(filters, activeSrc),
  }
}

export function matchesAdvancedFilters(row: SubscriptionRow, filters: AdvancedSubscriptionFilters, activeSrc: SourceFilter) {
  if (filters.sourceIds && filters.sourceIds.size > 0 && !filters.sourceIds.has(row.provider)) return false

  const planQ = filters.plan.trim().toLowerCase()
  if (planQ && !`${row.planName ?? ""} ${row.planCode ?? ""} ${row.planId ?? ""}`.toLowerCase().includes(planQ)) return false

  const clientQ = filters.client.trim().toLowerCase()
  if (clientQ && !`${row.customerName ?? ""} ${row.customerScope ?? ""}`.toLowerCase().includes(clientQ)) return false

  const imeiQ = filters.imei.trim().toLowerCase()
  if (imeiQ && !(row.imei ?? "").toLowerCase().includes(imeiQ)) return false

  if (activeSrc === "kite") return matchesKiteFilters(row, filters)
  if (activeSrc === "tele2") return matchesTele2Filters(row, filters)
  if (activeSrc === "moabits") return matchesMoabitsFilters(row, filters)
  return true
}

function providerFilterCount(filters: AdvancedSubscriptionFilters, activeSrc: SourceFilter) {
  if (activeSrc === "kite") {
    return (
      (filters.kiteAlias.trim() ? 1 : 0) +
      (filters.kiteCommercialGroup.trim() ? 1 : 0) +
      (filters.kiteSupervisionGroup.trim() ? 1 : 0) +
      (filters.kiteServicePack.trim() ? 1 : 0) +
      filters.kiteCustomFields.filter((value) => value.trim()).length
    )
  }
  if (activeSrc === "tele2") {
    return (
      (filters.tele2RatePlan.trim() ? 1 : 0) +
      (filters.tele2CommunicationPlan.trim() ? 1 : 0) +
      (filters.tele2AccountId.trim() ? 1 : 0) +
      filters.tele2AccountCustoms.filter((value) => value.trim()).length +
      filters.tele2OperatorCustoms.filter((value) => value.trim()).length +
      filters.tele2CustomerCustoms.filter((value) => value.trim()).length
    )
  }
  if (activeSrc === "moabits") {
    return (
      (filters.moabitsProductName.trim() ? 1 : 0) +
      (filters.moabitsProductCode.trim() ? 1 : 0) +
      (filters.moabitsCompanyCode.trim() ? 1 : 0) +
      (filters.moabitsAutorenewal !== "any" ? 1 : 0) +
      (filters.moabitsDataLimitMb.trim() ? 1 : 0) +
      (filters.moabitsSmsLimit.trim() ? 1 : 0) +
      (filters.moabitsCountry.trim() ? 1 : 0) +
      (filters.moabitsRatType.trim() ? 1 : 0)
    )
  }
  return 0
}

function providerQueryKey(filters: AdvancedSubscriptionFilters, activeSrc: SourceFilter) {
  if (activeSrc === "kite") {
    return {
      kiteAlias: filters.kiteAlias.trim(),
      kiteCommercialGroup: filters.kiteCommercialGroup.trim(),
      kiteSupervisionGroup: filters.kiteSupervisionGroup.trim(),
      kiteServicePack: filters.kiteServicePack.trim(),
      kiteCustomFields: filters.kiteCustomFields,
    }
  }
  if (activeSrc === "tele2") {
    return {
      tele2RatePlan: filters.tele2RatePlan.trim(),
      tele2CommunicationPlan: filters.tele2CommunicationPlan.trim(),
      tele2AccountId: filters.tele2AccountId.trim(),
      tele2AccountCustoms: filters.tele2AccountCustoms,
      tele2OperatorCustoms: filters.tele2OperatorCustoms,
      tele2CustomerCustoms: filters.tele2CustomerCustoms,
    }
  }
  if (activeSrc === "moabits") {
    return {
      moabitsProductName: filters.moabitsProductName.trim(),
      moabitsProductCode: filters.moabitsProductCode.trim(),
      moabitsCompanyCode: filters.moabitsCompanyCode.trim(),
      moabitsAutorenewal: filters.moabitsAutorenewal,
      moabitsDataLimitMb: filters.moabitsDataLimitMb.trim(),
      moabitsSmsLimit: filters.moabitsSmsLimit.trim(),
      moabitsCountry: filters.moabitsCountry.trim(),
      moabitsRatType: filters.moabitsRatType.trim(),
    }
  }
  return {}
}

function matchesKiteFilters(row: SubscriptionRow, filters: AdvancedSubscriptionFilters) {
  const customValues = [row.customField1, row.customField2, row.customField3, row.customField4]
  if (filters.kiteCustomFields.some((value, index) => textFilterMisses(customValues[index], value))) return false
  if (textFilterMisses(row.alias, filters.kiteAlias)) return false
  if (textFilterMisses(row.commercialGroup, filters.kiteCommercialGroup)) return false
  if (textFilterMisses(row.supervisionGroup, filters.kiteSupervisionGroup)) return false
  if (textFilterMisses(row.servicePack, filters.kiteServicePack)) return false
  return true
}

function matchesTele2Filters(row: SubscriptionRow, filters: AdvancedSubscriptionFilters) {
  if (textFilterMisses(row.planName, filters.tele2RatePlan)) return false
  if (textFilterMisses(row.communicationPlan, filters.tele2CommunicationPlan)) return false
  if (textFilterMisses(row.accountId, filters.tele2AccountId)) return false
  if (filters.tele2AccountCustoms.some((value, index) => textFilterMisses(row.accountCustoms[index], value))) return false
  if (filters.tele2OperatorCustoms.some((value, index) => textFilterMisses(row.operatorCustoms[index], value))) return false
  if (filters.tele2CustomerCustoms.some((value, index) => textFilterMisses(row.customerCustoms[index], value))) return false
  return true
}

function matchesMoabitsFilters(row: SubscriptionRow, filters: AdvancedSubscriptionFilters) {
  if (textFilterMisses(row.planName, filters.moabitsProductName)) return false
  if (textFilterMisses(row.productCode, filters.moabitsProductCode)) return false
  if (textFilterMisses(row.companyCode, filters.moabitsCompanyCode)) return false
  if (filters.moabitsAutorenewal !== "any" && !tristateTextMatches(row.autorenewal, filters.moabitsAutorenewal)) return false
  if (textFilterMisses(row.dataLimitMb, filters.moabitsDataLimitMb)) return false
  if (textFilterMisses(row.smsLimit, filters.moabitsSmsLimit)) return false
  if (textFilterMisses(row.country, filters.moabitsCountry)) return false
  if (textFilterMisses(row.ratType, filters.moabitsRatType)) return false
  return true
}

function textFilterMisses(value: string | null | undefined, query: string) {
  const q = query.trim().toLowerCase()
  return Boolean(q && !(value ?? "").toLowerCase().includes(q))
}

function tristateTextMatches(value: string | null, expected: "on" | "off") {
  const normalized = (value ?? "").trim().toLowerCase()
  if (!normalized) return false
  const truthy = new Set(["true", "1", "yes", "enabled", "active", "on", "si", "sí"])
  const falsy = new Set(["false", "0", "no", "disabled", "inactive", "off"])
  if (expected === "on") return truthy.has(normalized)
  return falsy.has(normalized)
}
