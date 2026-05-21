import { Suspense } from "react"
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

  const params = await searchParams
  const filters = {
    provider: single(params.provider),
    status: single(params.status),
    cursor: single(params.cursor),
    q: single(params.q),
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <SubscriptionsClient filters={filters} isAdmin={profile.role === ROLES.ADMIN} />
    </Suspense>
  )
}
