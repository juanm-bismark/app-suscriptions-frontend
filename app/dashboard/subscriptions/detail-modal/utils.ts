import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { SourceId } from "../tokens"

export const IDENTIFIER_COLORS = {
  iccid: "#33A6B2",
  msisdn: "#7B4FE0",
  imsi: "#E07A3A",
} as const

export function value(v: string | null | undefined) {
  return v && v.trim() ? v : "—"
}

export function detailHref(record: SubscriptionRow, selectedProvider?: SourceId, tab?: "actions") {
  const params = new URLSearchParams({ provider: selectedProvider ?? record.provider })
  if (tab) params.set("tab", tab)
  return `/dashboard/subscriptions/${encodeURIComponent(record.iccid)}?${params.toString()}`
}

