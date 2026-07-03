"use client"

import { cn } from "@/lib/utils"
import { Chip } from "../primitives"
import type { SourceFilter } from "./source-filter"
import { hasStatusSelections, statusKey, type NativeStatusSelections } from "./status-filter"
import type { StatusFilter } from "../list/types"
import { PROVIDER_NATIVE_STATUSES, SOURCES, STATUS_TONES, type SourceId } from "../tokens"

export function StatusFilterControls({
  activeSrc,
  activeStatus,
  statusSelections,
  activeProviders,
  statusCount,
  selectedCount,
  onActiveStatusChange,
  onClearSelections,
  onToggleSelection,
}: {
  activeSrc: SourceFilter
  activeStatus: StatusFilter
  statusSelections: NativeStatusSelections
  activeProviders: SourceId[]
  statusCount: (provider: SourceId, status: string) => number
  selectedCount: number
  onActiveStatusChange: (status: StatusFilter) => void
  onClearSelections: () => void
  onToggleSelection: (provider: SourceId, status: string) => void
}) {
  if (activeSrc !== "all") {
    const source = SOURCES[activeSrc]
    return (
      <div className="grid w-full min-w-0 gap-[7px]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 text-[11px] font-bold uppercase tracking-[0.5px] text-muted">
            Estado
          </div>
          {selectedCount > 0 && (
            <span className="font-mono text-[11px] font-bold" style={{ color: source.tintText }}>{selectedCount}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip active={activeStatus === "all"} color={source.color} onClick={() => onActiveStatusChange("all")}>
            Todos
          </Chip>
          {PROVIDER_NATIVE_STATUSES[activeSrc].map((status) => (
            <StatusOptionChip
              key={status.value}
              value={status.value}
              label={status.label}
              tone={status.tone}
              count={statusCount(activeSrc, status.value)}
              active={activeStatus !== "all" && statusKey(activeStatus) === statusKey(status.value)}
              onClick={() => onActiveStatusChange(status.value)}
            />
          ))}
        </div>
      </div>
    )
  }

  const anySelected = hasStatusSelections(statusSelections, activeProviders)
  return (
    <div className="grid w-full min-w-0 gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 text-[11px] font-bold uppercase tracking-[0.5px] text-muted">
          Estado por fuente
        </div>
        {selectedCount > 0 && <span className="font-mono text-[11px] font-bold text-header-bg">{selectedCount}</span>}
        <Chip active={!anySelected} onClick={onClearSelections}>
          Todos
        </Chip>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] items-start gap-2.5">
        {activeProviders.map((provider) => {
          const source = SOURCES[provider]
          return (
            <div key={provider} className="grid min-w-0 content-start gap-[7px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: source.color }} />
                <span className="text-[11.5px] font-extrabold text-title">{source.name}</span>
              </div>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {PROVIDER_NATIVE_STATUSES[provider].map((status) => (
                  <StatusOptionChip
                    key={status.value}
                    value={status.value}
                    label={status.label}
                    tone={status.tone}
                    count={statusCount(provider, status.value)}
                    active={Boolean(statusSelections[provider]?.has(status.value))}
                    onClick={() => onToggleSelection(provider, status.value)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusOptionChip({
  value,
  label,
  tone,
  count,
  active,
  onClick,
}: {
  value: string
  label: string
  tone: keyof typeof STATUS_TONES
  count: number
  active: boolean
  onClick: () => void
}) {
  const palette = STATUS_TONES[tone]
  return (
    <button
      type="button"
      title={value}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded border px-2 py-[5px] text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
        !active && "border-border bg-card text-text hover:bg-hover-soft"
      )}
      style={active ? { borderColor: palette.dot, background: palette.bg, color: palette.color } : undefined}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: palette.dot }} />
      <span>{label}</span>
      <span className={cn("font-mono text-[10.5px] font-bold", !active && "text-muted")} style={active ? { color: palette.color } : undefined}>
        {count}
      </span>
    </button>
  )
}
