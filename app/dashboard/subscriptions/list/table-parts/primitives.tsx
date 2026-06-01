"use client"

import type { ReactNode } from "react"
import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { Icon, StatusPillWithNative } from "../../primitives"
import { T } from "../../tokens"
import { rowKey } from "../rows"
import { CELL_STYLE, HEADER_CELL_STYLE } from "./constants"

export function TableHeader({ columns, gridTemplateColumns }: { columns: string[]; gridTemplateColumns: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns,
        fontSize: 10.5,
        letterSpacing: 0.6,
        color: T.tableHeaderText,
        fontWeight: 700,
        textTransform: "uppercase",
        background: T.tableHeaderBg,
        borderBottom: `1px solid ${T.border}`,
        position: "sticky",
        top: 0,
        zIndex: 2,
      }}
    >
      <div />
      {columns.map((column) => (
        <div key={column} style={HEADER_CELL_STYLE}>{column}</div>
      ))}
      <div style={{ ...HEADER_CELL_STYLE, textAlign: "right", paddingRight: 16 }} />
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
      style={{
        display: "grid",
        gridTemplateColumns,
        alignItems: "stretch",
        background: isDisabled ? "#F1F5F9" : isHovered ? T.zebra : index % 2 ? T.zebra : T.cardBg,
        borderBottom: `1px solid ${T.rowDivider}`,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "background .12s",
        fontSize: 12.5,
        opacity: isDisabled ? 0.62 : 1,
      }}
    >
      {children}
    </div>
  )
}

export function IccidCell({ row }: { row: SubscriptionRow }) {
  return (
    <div style={{ ...CELL_STYLE, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: T.fontMono, fontSize: 11.5, color: T.title, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {row.iccid}
      </span>
    </div>
  )
}

export function MonoCell({ children }: { children: ReactNode }) {
  return <div style={{ ...CELL_STYLE, display: "flex", alignItems: "center", fontFamily: T.fontMono, color: T.title }}>{children}</div>
}

export function TextCell({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <div style={{ ...CELL_STYLE, display: "flex", alignItems: "center", color: T.title, fontWeight: strong ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {children}
    </div>
  )
}

export function StatusCell({ row }: { row: SubscriptionRow }) {
  return (
    <div style={{ ...CELL_STYLE, display: "flex", alignItems: "center" }}>
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
      style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: 12 }}
    >
      <span style={{ color: T.muted, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 4 }}>
        <Icon.arrowRight size={13} />
      </span>
    </div>
  )
}

export function DetailCellSkeleton({ wide = false }: { wide?: boolean }) {
  return <span style={{ width: wide ? 92 : 58, height: 10, borderRadius: 3, background: "#E2EAEC", display: "inline-block" }} />
}

export function ServicePill({ enabled, label }: { enabled: boolean | null; label: string }) {
  const tone = enabled === true ? { bg: "#D7ECE4", color: "#1F6B53", mark: "✓" } : enabled === false ? { bg: "#FADDD6", color: "#9B3A2A", mark: "✗" } : { bg: T.zebra, color: T.muted, mark: "—" }
  return (
    <span style={{ background: tone.bg, color: tone.color, fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99, letterSpacing: 0.2 }}>
      {label} {tone.mark}
    </span>
  )
}

