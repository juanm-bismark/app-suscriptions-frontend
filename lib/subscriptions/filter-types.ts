import type { SearchField } from "@/lib/sim-identifiers"
import type { Provider } from "@/lib/types/api"
export { isProvider } from "@/lib/provider-meta"

export type SourceFilter = Provider | "all"
export type TristateFilter = "any" | "on" | "off"

export const KITE_CUSTOM_FIELD_COUNT = 4
export const TELE2_ACCOUNT_CUSTOM_COUNT = 10
export const TELE2_OPERATOR_CUSTOM_COUNT = 5
export const TELE2_CUSTOMER_CUSTOM_COUNT = 5

export interface SubscriptionAdvancedFilterInput {
  imei?: string
  operator?: string
  dataService?: TristateFilter
  smsService?: TristateFilter
  staleLuOnly?: boolean
  kiteAlias?: string
  kiteCommercialGroup?: string
  kiteSupervisionGroup?: string
  kiteServicePack?: string
  kiteCustomFields?: string[]
  tele2RatePlan?: string
  tele2CommunicationPlan?: string
  tele2AccountId?: string
  tele2AccountCustoms?: string[]
  tele2OperatorCustoms?: string[]
  tele2CustomerCustoms?: string[]
  moabitsProductName?: string
  moabitsProductCode?: string
  moabitsCompanyCode?: string
  moabitsAutorenewal?: TristateFilter
  moabitsDataLimitMb?: string
  moabitsSmsLimit?: string
  moabitsCountry?: string
  moabitsRatType?: string
}

export interface SubscriptionFilterInput extends SubscriptionAdvancedFilterInput {
  scope?: "company" | "global"
  provider?: string
  status?: string
  statuses?: string
  cursor?: string
  q?: string
  searchField?: SearchField
}

export interface AdvancedSubscriptionFilters {
  sourceIds: Set<Provider> | null
  plan: string
  client: string
  imei: string
  operator: string
  dataService: TristateFilter
  smsService: TristateFilter
  staleLuOnly: boolean
  kiteAlias: string
  kiteCommercialGroup: string
  kiteSupervisionGroup: string
  kiteServicePack: string
  kiteCustomFields: string[]
  tele2RatePlan: string
  tele2CommunicationPlan: string
  tele2AccountId: string
  tele2AccountCustoms: string[]
  tele2OperatorCustoms: string[]
  tele2CustomerCustoms: string[]
  moabitsProductName: string
  moabitsProductCode: string
  moabitsCompanyCode: string
  moabitsAutorenewal: TristateFilter
  moabitsDataLimitMb: string
  moabitsSmsLimit: string
  moabitsCountry: string
  moabitsRatType: string
}

export type AdvancedFilterSetter = <K extends keyof AdvancedSubscriptionFilters>(
  key: K,
  value: AdvancedSubscriptionFilters[K],
) => void

export type AdvancedArrayFilterKey =
  | "kiteCustomFields"
  | "tele2AccountCustoms"
  | "tele2OperatorCustoms"
  | "tele2CustomerCustoms"

export type AdvancedFiltersLoadInput = Pick<
  SubscriptionAdvancedFilterInput,
  | "imei"
  | "operator"
  | "dataService"
  | "smsService"
  | "staleLuOnly"
  | "kiteAlias"
  | "kiteCommercialGroup"
  | "kiteSupervisionGroup"
  | "kiteServicePack"
  | "kiteCustomFields"
  | "tele2RatePlan"
  | "tele2CommunicationPlan"
  | "tele2AccountId"
  | "tele2AccountCustoms"
  | "tele2OperatorCustoms"
  | "tele2CustomerCustoms"
  | "moabitsProductName"
  | "moabitsProductCode"
  | "moabitsCompanyCode"
  | "moabitsAutorenewal"
  | "moabitsDataLimitMb"
  | "moabitsSmsLimit"
  | "moabitsCountry"
  | "moabitsRatType"
>
