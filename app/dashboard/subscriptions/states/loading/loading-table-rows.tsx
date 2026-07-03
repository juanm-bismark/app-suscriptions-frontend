"use client"

import { cn } from "@/lib/utils"
import { SOURCES, type SourceId } from "../../tokens"
import { SkeletonCell } from "./skeleton-cell"
import { GRID_COLS_CLASS } from "./utils"

const cellH = "px-3 py-[9px]"

export function LoadingTableRows({ rowsSourceCycle }: { rowsSourceCycle: readonly SourceId[] }) {
  return (
    <div className="flex-1 overflow-auto bg-card">
      <div
        className={cn(
          "sticky top-0 z-[2] grid border-b border-border bg-table-header-bg text-[10.5px] font-bold uppercase tracking-[0.6px] text-table-header-text",
          GRID_COLS_CLASS
        )}
      >
        <div />
        <div className={cellH}>ICCID</div>
        <div className={cellH}>MSISDN</div>
        <div className={cellH}>IMSI</div>
        <div className={cellH}>Plan</div>
        <div className={cellH}>Operador</div>
        <div className={cellH}>Estado</div>
        <div className={cellH}>Última actualización</div>
        <div className={cn(cellH, "pr-4 text-right")} />
      </div>

      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className={cn("grid min-h-[54px] items-center border-b border-row-divider", GRID_COLS_CLASS)}
        >
          <div
            className="self-stretch"
            style={{ background: SOURCES[rowsSourceCycle[index % rowsSourceCycle.length]].color }}
          />
          <SkeletonCell width={116} />
          <SkeletonCell width={90} />
          <SkeletonCell width={112} />
          <SkeletonCell width={124} />
          <div className={cn(cellH, "flex items-center gap-2")}>
            <div className="skeleton-shimmer h-[18px] w-[18px] rounded" />
            <div className="skeleton-shimmer h-2.5 w-12 rounded-xs" />
          </div>
          <div className={cellH}>
            <div className="skeleton-shimmer h-[22px] w-[86px] rounded-full" />
          </div>
          <SkeletonCell width={84} />
          <div className="flex justify-end py-[9px] pl-3 pr-4">
            <div className="skeleton-shimmer h-[26px] w-[26px] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
