"use client"

import { buildHref } from "@/lib/url"
import { DashboardPaginationControls } from "../_components/dashboard-pagination-controls"

type CompanyPaginationControlsProps = {
  page: number
  pages: number | null
  size: number
  total: number | null
  query: string
  companyId?: string | null
}

export function CompanyPaginationControls({
  page,
  pages,
  size,
  total,
  query,
  companyId,
}: CompanyPaginationControlsProps) {
  return (
    <DashboardPaginationControls
      page={page}
      pages={pages}
      size={size}
      total={total}
      totalLabel={total !== null ? `${total} empresas` : undefined}
      variant="compact"
      selectWidth="w-20"
      getHref={(nextPage, nextSize) =>
        buildHref("/dashboard/credentials", {
          page: String(Math.max(nextPage, 1)),
          size: String(nextSize),
          q: query,
          companyId,
        })
      }
    />
  )
}
