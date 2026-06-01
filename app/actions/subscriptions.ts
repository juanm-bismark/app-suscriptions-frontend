"use server"

import type { Provider } from "@/lib/types/api"
import type {
  JobActionResult,
  LoadSubscriptionsInput,
  LoadSubscriptionsResult,
  LocationActionResult,
  SimDetailsActionResult,
  SimStatsActionResult,
  SmsHistoryActionResult,
  StatusHistoryActionResult,
  SyncStatusActionResult,
  SyncTriggerActionResult,
} from "@/lib/subscriptions/types"
import { loadSimDetailsForInput, loadLocationForInput, loadSmsHistoryForInput, loadStatusHistoryForInput } from "@/lib/subscriptions/server/details"
import { loadSubscriptionsForInput } from "@/lib/subscriptions/server/listing"
import { loadSimStatsForInput } from "@/lib/subscriptions/server/stats"
import { loadJobForId, loadSyncStatusForInput, triggerRoutingSyncForProvider } from "@/lib/subscriptions/server/sync"

export type {
  ActionProblem,
  FailedProvider,
  JobActionResult,
  LoadSubscriptionsData,
  LoadSubscriptionsInput,
  LoadSubscriptionsResult,
  LocationActionResult,
  ProviderStatus,
  SearchField,
  SimDetailsActionResult,
  SimStatsActionResult,
  SmsHistoryActionResult,
  StatusHistoryActionResult,
  SyncStatusActionResult,
  SyncTriggerActionResult,
} from "@/lib/subscriptions/types"

export async function loadSubscriptions(input: LoadSubscriptionsInput): Promise<LoadSubscriptionsResult> {
  return loadSubscriptionsForInput(input)
}

export async function loadSimDetails(input: { iccids: string[]; providers?: Provider[] }): Promise<SimDetailsActionResult> {
  return loadSimDetailsForInput(input)
}

export async function loadSyncStatus(): Promise<SyncStatusActionResult> {
  return loadSyncStatusForInput()
}

export async function triggerRoutingSync(provider: Provider): Promise<SyncTriggerActionResult> {
  return triggerRoutingSyncForProvider(provider)
}

export async function loadJob(jobId: string): Promise<JobActionResult> {
  return loadJobForId(jobId)
}

export async function loadSmsHistory(input: {
  iccid: string
  startDate?: string
  endDate?: string
}): Promise<SmsHistoryActionResult> {
  return loadSmsHistoryForInput(input)
}

export async function loadStatusHistory(input: {
  iccid: string
  startDate?: string
  endDate?: string
}): Promise<StatusHistoryActionResult> {
  return loadStatusHistoryForInput(input)
}

export async function loadLocation(input: { iccid: string }): Promise<LocationActionResult> {
  return loadLocationForInput(input)
}

export async function loadSimStats(input: LoadSubscriptionsInput = {}): Promise<SimStatsActionResult> {
  return loadSimStatsForInput(input)
}
