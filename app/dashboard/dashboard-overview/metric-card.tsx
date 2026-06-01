"use client"

import type { ReactNode } from "react"
import { RefreshCcw } from "lucide-react"

type MetricTone = "inventory" | "provider" | "health"

const METRIC_TONES: Record<MetricTone, { card: string; icon: string; label: string; skeleton: string }> = {
  inventory: {
    card: "from-white to-metric-soft",
    icon: "bg-accent-soft text-action-teal-hover",
    label: "text-action-soft",
    skeleton: "bg-zebra",
  },
  provider: {
    card: "from-white to-provider-tele2-soft",
    icon: "bg-provider-tele2-soft text-role-manager-text",
    label: "text-role-manager-text",
    skeleton: "bg-white/75",
  },
  health: {
    card: "from-white to-provider-moabits-soft",
    icon: "bg-provider-moabits-soft text-role-admin-text",
    label: "text-role-admin-text",
    skeleton: "bg-white/75",
  },
}

export function MetricCard({
  icon,
  label,
  value,
  help,
  loading,
  tone = "inventory",
}: {
  icon: ReactNode
  label: string
  value: string
  help: string
  loading: boolean
  tone?: MetricTone
}) {
  const classes = METRIC_TONES[tone]

  return (
    <div className={`flex min-h-32 flex-col justify-between rounded-lg bg-gradient-to-b px-4 py-4 shadow-sm shadow-header-top/5 lg:h-full ${classes.card}`}>
      <div className={`flex items-center gap-2 ${classes.label}`}>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md shadow-sm shadow-header-top/5 ${classes.icon}`}>
          {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {loading ? (
        <>
          <div className={`my-3 h-9 w-20 animate-pulse rounded ${classes.skeleton}`} />
          <div className={`h-3 w-28 animate-pulse rounded ${classes.skeleton}`} />
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
