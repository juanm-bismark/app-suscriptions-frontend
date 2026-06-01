"use client"

import type { LoadSubscriptionsInput } from "@/lib/subscriptions/types"
import { useRouter, useSearchParams } from "next/navigation"
import { PROVIDER_IDS, sanitizeProviderIds } from "./filters/source-filter"
import { SubscriptionsLoader } from "./list/loader"
import { ListEmptyShell } from "./list/notices"
import type { ViewScope } from "./list/types"
import { ErrorState, LoadingState } from "./state-views"
import type { SourceId } from "./tokens"

export function SubscriptionsClient({
  filters,
  isAdmin = false,
  activeProviders,
  hasCompanyScope = true,
}: {
  filters?: LoadSubscriptionsInput
  isAdmin?: boolean
  activeProviders?: SourceId[] | null
  hasCompanyScope?: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const stateOverride = searchParams.get("state")
  const viewScope: ViewScope = isAdmin && filters?.scope === "global" ? "global" : "company"
  const loadingProviders = viewScope === "global" ? PROVIDER_IDS : sanitizeProviderIds(activeProviders)

  if (stateOverride === "loading") {
    return <LoadingState filters={filters} activeProviders={loadingProviders} />
  }

  if (stateOverride === "error") {
    return <ErrorState query={filters?.q || undefined} onRetry={() => router.refresh()} />
  }

  if (stateOverride === "empty") {
    return <ListEmptyShell query={filters?.q || undefined} />
  }

  return (
    <SubscriptionsLoader
      filters={filters}
      isAdmin={isAdmin}
      activeProviders={activeProviders}
      hasCompanyScope={hasCompanyScope}
    />
  )
}
