import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type {
  AsyncJobOut,
  LocationOut,
  SimDetailsOut,
  SimStatsOut,
  SmsHistoryOut,
  StatusHistoryOut,
  SyncStatusOut,
  SyncTriggerOut,
} from "@/lib/types/api"
import type { SearchField } from "@/lib/sim-identifiers"
import type { NormalizedSubscriptionFilters, SubscriptionFilterInput } from "./filters"

export type SubscriptionScope = "company" | "global"

export type FailedProvider = { provider: string; code: string; title: string }
export type ProviderStatus = {
  provider: string
  status: "ok" | "partial" | "error" | "not_queried"
  count: number
  code: string | null
  title: string | null
}

export interface LoadSubscriptionsInput extends SubscriptionFilterInput {
  limit?: number
  size?: string
}

export interface LoadSubscriptionsData {
  rows: SubscriptionRow[]
  detailLookup?: SimDetailsOut
  pagination: {
    nextCursor: string | null
    total: number | null
    partial: boolean
    failedProviders: FailedProvider[]
    providerStatuses: ProviderStatus[]
  }
  filters: NormalizedSubscriptionFilters
}

export type LoadSubscriptionsResult =
  | { ok: true; data: LoadSubscriptionsData }
  | { ok: false; kind: "routing_map_empty"; failedProviders: FailedProvider[] }
  | { ok: false; kind: "error"; error: string }

export type ActionProblem = {
  status: number
  code?: string
  title?: string
  detail?: string | null
  retryAfter?: number
}

export type SimDetailsActionResult =
  | { ok: true; data: SimDetailsOut }
  | { ok: false; error: ActionProblem }

export type SyncStatusActionResult =
  | { ok: true; data: SyncStatusOut }
  | { ok: false; error: ActionProblem }

export type SyncTriggerActionResult =
  | { ok: true; data: SyncTriggerOut }
  | { ok: false; alreadyRunning: true; error: ActionProblem }
  | { ok: false; alreadyRunning?: false; error: ActionProblem }

export type JobActionResult =
  | { ok: true; data: AsyncJobOut }
  | { ok: false; error: ActionProblem }

export type SmsHistoryActionResult =
  | { ok: true; data: SmsHistoryOut }
  | { ok: false; error: ActionProblem }

export type StatusHistoryActionResult =
  | { ok: true; data: StatusHistoryOut }
  | { ok: false; error: ActionProblem }

export type LocationActionResult =
  | { ok: true; data: LocationOut }
  | { ok: false; error: ActionProblem }

export type SimStatsActionResult =
  | { ok: true; data: SimStatsOut }
  | { ok: false; error: ActionProblem }

export type { SearchField }
