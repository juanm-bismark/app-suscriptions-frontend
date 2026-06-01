"use client"

import type { ReactNode } from "react"
import { RefreshCcw } from "lucide-react"

export function MetricCard({
  icon,
  label,
  value,
  help,
  loading,
}: {
  icon: ReactNode
  label: string
  value: string
  help: string
  loading: boolean
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-lg bg-gradient-to-b from-white to-metric-soft px-4 py-4 shadow-sm shadow-header-top/5 lg:h-full">
      <div className="flex items-center gap-2 text-action-soft">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-action-teal-hover shadow-sm shadow-header-top/5">
          {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {loading ? (
        <>
          <div className="my-3 h-9 w-20 animate-pulse rounded bg-zebra" />
          <div className="h-3 w-28 animate-pulse rounded bg-zebra" />
        </>
      ) : (
        <>
          <div className="py-3 text-3xl font-bold text-title">{value}</div>
          <p className="text-xs text-muted">{help}</p>
        </>
      )}
    </div>
  )
}
