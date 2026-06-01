"use client"

import { buildHref } from "@/lib/url"
import { DashboardPaginationControls } from "../_components/dashboard-pagination-controls"

type PaginationControlsProps = {
  page: number
  pages: number | null
  size: number
  total: number | null
  query?: string
}

export default function PaginationControls({
  page,
  pages,
  size,
  total,
  query = "",
}: PaginationControlsProps) {
  return (
    <DashboardPaginationControls
      page={page}
      pages={pages}
      size={size}
      total={total}
      totalLabel={total !== null ? `${total} usuarios` : undefined}
      nextFromTotal={false}
      getHref={(nextPage, nextSize) =>
        buildHref("/dashboard/users", {
          page: String(Math.max(nextPage, 1)),
          size: String(nextSize),
          q: query,
        })
      }
    />
  )
}
