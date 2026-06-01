import type { ReactNode } from "react"
import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { SimDetailsResult } from "@/lib/types/api"

export type DetailsQueryLike = {
  data: { results: Record<string, SimDetailsResult> } | undefined
  isFetching: boolean
  refetch: () => unknown
}

export interface TableProps {
  rows: SubscriptionRow[]
  detailsQuery: DetailsQueryLike
  hovered: string | null
  setHovered: (key: string | null) => void
  setOpenRecord: (row: SubscriptionRow | null) => void
  emptyState: ReactNode
}

