import type { ReactNode } from "react"
import { dashboardStyles } from "./dashboard-styles"

export function DashboardPanel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`${dashboardStyles.panel} ${className}`}>
      {children}
    </div>
  )
}

export function DashboardSummaryBadge({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={`${dashboardStyles.summaryBadge} ${className}`}>
      <span className={dashboardStyles.summaryIcon}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-title">{value}</p>
      </div>
    </div>
  )
}

export function DashboardSearchShell({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`${dashboardStyles.searchShell} ${className}`}>
      {children}
    </div>
  )
}
