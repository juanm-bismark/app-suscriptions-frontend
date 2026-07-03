"use client"

import { cn } from "@/lib/utils"
import type { SourceFilter } from "../../filters/source-filter"
import { isSelectedStatus, type NativeStatusSelections } from "../../filters/status-filter"
import { SOURCES, type SourceId, STATUS_TONES } from "../../tokens"
import { statusesForProvider } from "./utils"

export function LoadingSourceSummary({
  activeSource,
  activeStatus,
  displayProviderIds,
  statusSelections,
}: {
  activeSource: SourceFilter
  activeStatus?: string
  displayProviderIds: readonly SourceId[]
  statusSelections: NativeStatusSelections
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-2.5",
        activeSource === "all" ? "grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]" : "grid-cols-1"
      )}
    >
      {(activeSource === "all" ? displayProviderIds : [activeSource]).map((provider) => {
        const source = SOURCES[provider]
        return (
          <div key={provider} className="grid min-w-0 content-start gap-[7px]">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: source.color }} />
              <span className="text-[11.5px] font-extrabold text-title">{source.name}</span>
            </div>
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {statusesForProvider(provider, activeSource === provider ? activeStatus : undefined).map((status) => {
                const palette = STATUS_TONES[status.tone]
                const active =
                  activeSource === provider
                    ? isSelectedStatus(activeStatus, status.value)
                    : Boolean(statusSelections[provider]?.has(status.value))
                return (
                  <span
                    key={status.value}
                    title={status.value}
                    className={cn(
                      "inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded border px-2 py-[5px] text-xs font-bold",
                      !active && "border-border bg-card text-text"
                    )}
                    style={active ? { borderColor: palette.dot, background: palette.bg, color: palette.color } : undefined}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: palette.dot }} />
                    <span>{status.label}</span>
                    <span className="skeleton-shimmer h-2 w-3.5 rounded-xs" />
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
