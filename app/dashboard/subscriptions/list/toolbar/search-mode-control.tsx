"use client"

import { cn } from "@/lib/utils"
import { SEARCH_MODE_OPTIONS, type SearchMode } from "@/lib/sim-identifiers"

export function SearchModeControl({
  activeSearchMode,
  onChange,
}: {
  activeSearchMode: SearchMode
  onChange: (mode: SearchMode) => void
}) {
  return (
    <div className="inline-flex w-fit items-center overflow-hidden rounded-[5px] border border-border bg-card">
      {SEARCH_MODE_OPTIONS.map((option) => {
        const active = activeSearchMode === option.id
        return (
          <button
            key={option.id}
            type="button"
            title={option.title}
            onClick={() => onChange(option.id)}
            className={cn(
              "px-[7px] py-[5px] text-[11px] font-extrabold leading-none transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
              option.id !== "imsi" && "border-r border-border",
              active ? "bg-header-bg text-white" : "bg-transparent text-text hover:bg-hover-soft"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
