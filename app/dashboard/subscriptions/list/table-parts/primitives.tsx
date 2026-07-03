"use client"

import type { ReactNode } from "react"
import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { cn } from "@/lib/utils"
import { Icon, StatusPillWithNative } from "../../primitives"
import { rowKey } from "../rows"
import { CELL_CLASS, HEADER_CELL_CLASS } from "./constants"

export function TableHeader({ columns, gridTemplateColumns }: { columns: string[]; gridTemplateColumns: string }) {
  return (
    <div
      className="sticky top-0 z-2 grid border-b border-border bg-table-header-bg text-[10.5px] font-bold uppercase tracking-[0.6px] text-table-header-text"
      style={{ gridTemplateColumns }}
    >
      <div />
      {columns.map((column) => (
        <div key={column} className={HEADER_CELL_CLASS}>{column}</div>
      ))}
      <div className={cn(HEADER_CELL_CLASS, "pr-4 text-right")} />
    </div>
  )
}

export function TableRowShell({
  row,
  index,
  gridTemplateColumns,
  isDisabled,
  isHovered,
  onHover,
  onOpen,
  children,
}: {
  row: SubscriptionRow
  index: number
  gridTemplateColumns: string
  isDisabled: boolean
  isHovered: boolean
  onHover: (key: string | null) => void
  onOpen: (row: SubscriptionRow | null) => void
  children: ReactNode
}) {
  return (
    <div
      onClick={() => { if (!isDisabled) onOpen(row) }}
      onMouseEnter={() => onHover(rowKey(row))}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "grid items-stretch border-b border-row-divider text-[12.5px] transition-colors duration-[120ms]",
        isDisabled
          ? "cursor-not-allowed bg-[#F1F5F9] opacity-[0.62]"
          : ["cursor-pointer", isHovered || index % 2 ? "bg-zebra" : "bg-card"],
      )}
      style={{ gridTemplateColumns }}
    >
      {children}
    </div>
  )
}

export function IccidCell({ row }: { row: SubscriptionRow }) {
  return (
    <div className={cn(CELL_CLASS, "flex items-center gap-2")}>
      <span className="truncate font-mono text-[11.5px] font-medium text-title">
        {row.iccid}
      </span>
    </div>
  )
}

export function MonoCell({ children }: { children: ReactNode }) {
  return <div className={cn(CELL_CLASS, "flex items-center font-mono text-title")}>{children}</div>
}

export function TextCell({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <div className={cn(CELL_CLASS, "flex items-center truncate text-title", strong ? "font-semibold" : "font-medium")}>
      {children}
    </div>
  )
}

export function StatusCell({ row }: { row: SubscriptionRow }) {
  return (
    <div className={cn(CELL_CLASS, "flex items-center")}>
      <StatusPillWithNative
        provider={row.provider}
        status={row.status}
        nativeStatus={row.nativeStatus}
        displayLabel={row.statusLabel}
        statusGroup={row.statusGroup}
        showContext={false}
        size="sm"
      />
    </div>
  )
}

export function OpenCell({
  row,
  isDisabled,
  onOpen,
}: {
  row: SubscriptionRow
  isDisabled: boolean
  onOpen: (row: SubscriptionRow | null) => void
}) {
  return (
    <div
      onClick={(event) => {
        event.stopPropagation()
        if (!isDisabled) onOpen(row)
      }}
      title="Abrir suscripción"
      className="flex items-center justify-end pr-3"
    >
      <span className="inline-flex size-[26px] cursor-pointer items-center justify-center rounded text-muted">
        <Icon.arrowRight size={13} />
      </span>
    </div>
  )
}

export function DetailCellSkeleton({ wide = false }: { wide?: boolean }) {
  return <span className={cn("inline-block h-2.5 rounded-[3px] bg-[#E2EAEC]", wide ? "w-[92px]" : "w-[58px]")} />
}

export function ServicePill({ enabled, label }: { enabled: boolean | null; label: string }) {
  const tone = enabled === true
    ? { className: "bg-[#D7ECE4] text-[#1F6B53]", mark: "✓" }
    : enabled === false
      ? { className: "bg-[#FADDD6] text-[#9B3A2A]", mark: "✗" }
      : { className: "bg-zebra text-muted", mark: "—" }
  return (
    <span className={cn("rounded-full px-[7px] py-0.5 text-[10.5px] font-bold tracking-[0.2px]", tone.className)}>
      {label} {tone.mark}
    </span>
  )
}
