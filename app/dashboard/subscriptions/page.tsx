import { Suspense } from "react"
import { listActiveCredentialProviders } from "@/app/actions/providers"
import { requireCompanyUser } from "@/lib/auth/current-user"
import { ROLES } from "@/lib/types/user"
import { LoadingState } from "./state-views"
import { SubscriptionsClient } from "./subscriptions-client"

export const metadata = {
  title: "Suscripciones · Bismark",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function single(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

export default async function SubscriptionsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireCompanyUser()
  const activeProviders = await listActiveCredentialProviders()

  const params = await searchParams
  const initialScope: "company" | "global" = single(params.scope) === "global" || !profile.company_id ? "global" : "company"
  const filters = {
    scope: initialScope,
    provider: single(params.provider),
    status: single(params.status),
    statuses: single(params.statuses),
    cursor: single(params.cursor),
    size: single(params.size),
    q: single(params.q),
  }

  return (
    <Suspense fallback={<LoadingState filters={filters} />}>
      <SubscriptionsClient
        filters={filters}
        isAdmin={profile.role === ROLES.ADMIN}
        activeProviders={activeProviders}
        hasCompanyScope={Boolean(profile.company_id)}
      />
    </Suspense>
  )
}
