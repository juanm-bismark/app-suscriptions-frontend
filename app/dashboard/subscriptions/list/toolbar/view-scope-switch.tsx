"use client"

import { cn } from "@/lib/utils"
import type { ViewScope } from "../types"

export function ViewScopeSwitch({
  viewScope,
  hasCompanyScope,
  onSwitchViewScope,
}: {
  viewScope: ViewScope
  hasCompanyScope: boolean
  onSwitchViewScope: (scope: ViewScope) => void
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-border bg-page">
      <button
        type="button"
        onClick={() => onSwitchViewScope("company")}
        disabled={!hasCompanyScope}
        title={hasCompanyScope ? undefined : "Admin sin company asignada"}
        className={cn(
          "whitespace-nowrap border-r border-border px-2.5 py-1.5 text-xs font-bold focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
          viewScope === "company"
            ? "bg-header-bg text-white"
            : hasCompanyScope
              ? "cursor-pointer bg-transparent text-text hover:bg-hover-soft"
              : "cursor-not-allowed bg-transparent text-muted"
        )}
      >
        Vista mi company
      </button>
      <button
        type="button"
        onClick={() => onSwitchViewScope("global")}
        className={cn(
          "cursor-pointer whitespace-nowrap px-2.5 py-1.5 text-xs font-bold focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
          viewScope === "global" ? "bg-header-bg text-white" : "bg-transparent text-text hover:bg-hover-soft"
        )}
      >
        Vista global
      </button>
    </div>
  )
}
