import type { DashboardProviderHint } from "@/app/actions/dashboard"

export type ProviderCardItem = (DashboardProviderHint | {
  provider: DashboardProviderHint["provider"]
  count: null
  partial: false
  status: "loading"
  error: null
})
