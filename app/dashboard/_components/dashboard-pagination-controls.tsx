"use client"

import { useTransition } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { dashboardStyles } from "./dashboard-styles"
import { PendingLinkButton } from "./pending-link-button"

export const DASHBOARD_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

type DashboardPaginationControlsProps = {
  page: number
  pages: number | null
  size: number
  total: number | null
  totalLabel?: string
  disabled?: boolean
  nextFromTotal?: boolean
  variant?: "default" | "compact"
  selectWidth?: string
  getHref?: (page: number, size: number) => string
  onPageChange?: (page: number) => void
  onSizeChange?: (size: number) => void
}

export function DashboardPaginationControls({
  page,
  pages,
  size,
  total,
  totalLabel,
  disabled = false,
  nextFromTotal = true,
  variant = "default",
  selectWidth = "w-24",
  getHref,
  onPageChange,
  onSizeChange,
}: DashboardPaginationControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isDisabled = disabled || isPending
  const hasPrevious = page > 1
  const hasNext = pages !== null ? page < pages : nextFromTotal && total !== null ? page * size < total : false
  const summary = `Página ${page}${pages ? ` de ${pages}` : ""}${totalLabel ? ` · ${totalLabel}` : ""}`

  function changeSize(nextSize: number) {
    if (getHref) {
      startTransition(() => router.push(getHref(1, nextSize)))
      return
    }
    onSizeChange?.(nextSize)
  }

  const nav = (
    <div className={variant === "compact" ? "grid grid-cols-2 gap-2" : "flex gap-2"}>
      <PageButton
        enabled={hasPrevious}
        disabled={isDisabled}
        href={getHref?.(page - 1, size)}
        onClick={onPageChange ? () => onPageChange(page - 1) : undefined}
        className={hasPrevious ? dashboardStyles.paginationPreviousEnabled : dashboardStyles.paginationPreviousDisabled}
        compact={variant === "compact"}
      >
        Anterior
      </PageButton>
      <PageButton
        enabled={hasNext}
        disabled={isDisabled}
        href={getHref?.(page + 1, size)}
        onClick={onPageChange ? () => onPageChange(page + 1) : undefined}
        className={hasNext ? dashboardStyles.paginationNextEnabled : dashboardStyles.paginationNextDisabled}
        compact={variant === "compact"}
      >
        Siguiente
      </PageButton>
    </div>
  )

  const pageSize = (
    <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted">
      <span>Mostrar</span>
      <Select
        value={String(size)}
        disabled={isDisabled}
        onChange={(event) => changeSize(Number(event.target.value))}
        className={`${dashboardStyles.pageSizeSelect} ${selectWidth}`}
      >
        {DASHBOARD_PAGE_SIZE_OPTIONS.map((option) => (
          <SelectItem key={option} value={String(option)}>
            {option}
          </SelectItem>
        ))}
      </Select>
    </div>
  )

  if (variant === "compact") {
    return (
      <div className="mt-5 space-y-3 border-t border-divider-soft pt-4 text-sm text-muted">
        {nav}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
          <span>{summary}</span>
          {pageSize}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5 flex flex-col gap-3 pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>{summary}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {pageSize}
        {nav}
      </div>
    </div>
  )
}

function PageButton({
  enabled,
  disabled,
  href,
  onClick,
  className,
  compact,
  children,
}: {
  enabled: boolean
  disabled: boolean
  href?: string
  onClick?: () => void
  className: string
  compact: boolean
  children: ReactNode
}) {
  const baseClass = `rounded-md ${compact ? "px-2 py-2 text-center text-xs" : "px-3 py-2"} font-semibold transition-colors ${className}`

  if (href) {
    return (
      <PendingLinkButton
        href={href}
        disabled={!enabled || disabled}
        loadingText="Cargando..."
        className={baseClass}
      >
        {children}
      </PendingLinkButton>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={!enabled || disabled}
      loading={disabled && enabled}
      loadingText="Cargando..."
      onClick={onClick}
      className={baseClass}
    >
      {children}
    </Button>
  )
}
