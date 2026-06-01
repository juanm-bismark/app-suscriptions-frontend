"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import type { UsageControl } from "@/lib/types/api"
import { formatVal, prettyKey } from "../data"
import { T } from "../tokens"

export type DetailRow = { label: string; value: string; mono?: boolean; sub?: string; dot?: string }

export function SummaryField({
  label,
  children,
  sub,
  mono,
  preserveValue,
}: {
  label: string
  children: ReactNode
  sub?: string
  mono?: boolean
  preserveValue?: boolean
}) {
  return (
    <div style={{ background: T.cardBg, padding: "12px 16px" }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: T.title,
          letterSpacing: -0.2,
          overflow: preserveValue ? "visible" : "hidden",
          textOverflow: preserveValue ? "clip" : "ellipsis",
          whiteSpace: preserveValue ? "normal" : "nowrap",
          overflowWrap: preserveValue ? "anywhere" : undefined,
          lineHeight: preserveValue ? 1.35 : undefined,
          fontFamily: mono ? T.fontMono : T.fontBody,
        }}
      >
        {children}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function FieldGrid({ rows }: { rows: DetailRow[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
      {rows.map((row) => (
        <KV key={row.label} label={row.label} value={row.value} mono={row.mono} sub={row.sub} dot={row.dot} />
      ))}
    </div>
  )
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, color: T.title, fontWeight: 800, fontSize: 13 }}>
        {title}
      </div>
      <div>{children}</div>
    </section>
  )
}

export function KV({ label, value, sub, mono, dot }: { label: string; value: string; sub?: string; mono?: boolean; dot?: string }) {
  return (
    <div style={{ padding: 16, borderRight: `1px solid ${T.divider}`, borderBottom: `1px solid ${T.divider}`, minWidth: 0 }}>
      <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.6, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: T.title, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: mono ? T.fontMono : T.fontBody, display: "flex", alignItems: "center", gap: 7 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: 99, background: dot, flexShrink: 0 }} />}
        {value}
      </div>
      {sub && <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div style={{ padding: 18, color: T.muted, fontSize: 13 }}>{text}</div>
}

export function BarChart({ bars }: { bars: { label: string; value: number; unit: string }[] }) {
  const visibleBars = useMemo(() => bars.slice(-30), [bars])
  const max = Math.max(...visibleBars.map((bar) => bar.value), 1)
  return (
    <div style={{ padding: 18 }}>
      <div style={{ height: 180, display: "flex", alignItems: "end", gap: 6 }}>
        {visibleBars.map((bar, index) => (
          <div key={`${bar.label}-${index}`} style={{ flex: 1, minWidth: 8, display: "flex", alignItems: "end" }}>
            <div title={`${bar.label}: ${bar.value} ${bar.unit}`} style={{ width: "100%", height: `${Math.max(6, (bar.value / max) * 170)}px`, background: T.headerAccent, borderRadius: "3px 3px 0 0" }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LimitGroup({ title, controls }: { title: string; controls: Record<string, UsageControl> | null }) {
  const entries = Object.entries(controls ?? {})
  return (
    <Card title={title}>
      {entries.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {entries.map(([metric, control]) => (
            <KV
              key={metric}
              label={prettyKey(metric)}
              value={`${formatVal(control.value)} / ${formatVal(control.limit)}`}
              sub={[control.threshold_reached ? "umbral alcanzado" : null, control.traffic_cut ? "tráfico cortado" : null, control.enabled === false ? "deshabilitado" : null].filter(Boolean).join(" · ") || "normal"}
              dot={control.traffic_cut ? T.danger : control.threshold_reached ? T.warning : T.success}
            />
          ))}
        </div>
      ) : (
        <Empty text="Sin controles configurados." />
      )}
    </Card>
  )
}
