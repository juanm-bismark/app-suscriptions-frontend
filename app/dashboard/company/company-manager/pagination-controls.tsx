"use client"

import { DashboardPaginationControls } from "../../_components/dashboard-pagination-controls"

export function PaginationControls({
  page,
  pages,
  size,
  total,
  isLoading,
  onSizeChange,
  onPrevious,
  onNext,
}: {
  page: number
  pages: number | null
  size: number
  total: number | null
  isLoading: boolean
  onSizeChange: (size: number) => void
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <DashboardPaginationControls
      page={page}
      pages={pages}
      size={size}
      total={total}
      totalLabel={total !== null ? `${total} empresas` : undefined}
      disabled={isLoading}
      onSizeChange={onSizeChange}
      onPageChange={(nextPage) => {
        if (nextPage < page) onPrevious()
        else onNext()
      }}
    />
  )
}
