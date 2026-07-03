"use client"

import { Icon } from "../../primitives"

export function StatusChangeRow({
  sourceColor,
  sourceName,
  targets,
  effectiveTarget,
  onTargetChange,
  onBegin,
}: {
  sourceColor: string
  sourceName: string
  targets: string[]
  effectiveTarget: string
  onTargetChange: (target: string) => void
  onBegin: () => void
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-md border border-border bg-card p-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ background: `${sourceColor}22`, color: sourceColor }}
      >
        <Icon.chev size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold text-title">Cambiar estado</div>
        <div className="mt-0.5 text-xs leading-[1.4] text-muted">
          Estados permitidos por {sourceName}.
        </div>
      </div>
      <select
        value={effectiveTarget}
        onChange={(event) => onTargetChange(event.target.value)}
        className="min-w-[170px] shrink-0 cursor-pointer rounded-[5px] border border-border bg-card px-2.5 py-[7px] font-mono text-xs font-extrabold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
      >
        {targets.map((target) => (
          <option key={target} value={target}>{target}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={onBegin}
        disabled={!effectiveTarget}
        className="shrink-0 rounded-[5px] border border-border bg-card px-2.5 py-[7px] text-xs font-extrabold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent disabled:cursor-not-allowed disabled:text-muted enabled:cursor-pointer enabled:hover:bg-hover-soft"
      >
        Cambiar
      </button>
    </div>
  )
}
