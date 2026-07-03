"use client"

import { cn } from "@/lib/utils"
import { Icon } from "../../primitives"

export function AdvancedFiltersButton({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  const active = count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-[7px] whitespace-nowrap rounded border px-[11px] py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
        active ? "border-header-bg bg-header-bg text-white" : "border-border bg-card text-text hover:bg-hover-soft"
      )}
    >
      <Icon.filter size={13} />
      Filtros avanzados
      {active && (
        <span className="min-w-4 rounded-full bg-card px-[5px] text-center font-mono text-[10.5px] font-bold leading-[15px] text-header-bg">
          {count}
        </span>
      )}
    </button>
  )
}
