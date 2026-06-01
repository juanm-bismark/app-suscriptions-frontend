"use client"

import { buildHref } from "@/lib/url"
import { DashboardPaginationControls } from "../../_components/dashboard-pagination-controls"

type MoabitsPaginationControlsProps = {
  page: number
  pages: number | null
  size: number
  total: number | null
  query?: string
}

export function MoabitsPaginationControls({
  page,
  pages,
  size,
  total,
  query = "",
}: MoabitsPaginationControlsProps) {
  return (
    <DashboardPaginationControls
      page={page}
      pages={pages}
      size={size}
      total={total}
      totalLabel={total !== null ? `${total} vinculacion${total !== 1 ? "es" : ""}` : undefined}
      nextFromTotal={false}
      getHref={(nextPage, nextSize) =>
        buildHref("/dashboard/company/moabits", {
          page: String(Math.max(nextPage, 1)),
          size: String(nextSize),
          q: query,
        })
      }
    />
  )
}
