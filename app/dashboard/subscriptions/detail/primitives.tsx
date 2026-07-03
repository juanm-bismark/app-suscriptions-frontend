"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
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
    <div className="bg-card px-4 py-3">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[1px] text-muted">{label}</div>
      <div
        className={cn(
          "text-sm font-bold tracking-[-0.2px] text-title",
          mono ? "font-mono" : "font-body",
          preserveValue
            ? "overflow-visible text-clip whitespace-normal [overflow-wrap:anywhere] leading-[1.35]"
            : "overflow-hidden text-ellipsis whitespace-nowrap"
        )}
      >
        {children}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  )
}

export function FieldGrid({ rows }: { rows: DetailRow[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
      {rows.map((row) => (
        <KV key={row.label} label={row.label} value={row.value} mono={row.mono} sub={row.sub} dot={row.dot} />
      ))}
    </div>
  )
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-divider px-4 py-[13px] text-[13px] font-extrabold text-title">
        {title}
      </div>
      <div>{children}</div>
    </section>
  )
}

export function KV({ label, value, sub, mono, dot }: { label: string; value: string; sub?: string; mono?: boolean; dot?: string }) {
  return (
    <div className="min-w-0 border-b border-r border-divider p-4">
      <div className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.6px] text-muted">
        {label}
      </div>
      <div
        className={cn(
          "flex items-center gap-[7px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-title",
          mono ? "font-mono" : "font-body"
        )}
      >
        {dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />}
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="p-[18px] text-[13px] text-muted">{text}</div>
}

export function BarChart({ bars }: { bars: { label: string; value: number; unit: string }[] }) {
  const visibleBars = useMemo(() => bars.slice(-30), [bars])
  const max = Math.max(...visibleBars.map((bar) => bar.value), 1)
  return (
    <div className="p-[18px]">
      <div className="flex h-[180px] items-end gap-1.5">
        {visibleBars.map((bar, index) => (
          <div key={`${bar.label}-${index}`} className="flex min-w-2 flex-1 items-end">
            <div
              title={`${bar.label}: ${bar.value} ${bar.unit}`}
              className="w-full rounded-t-[3px] bg-header-accent"
              style={{ height: `${Math.max(6, (bar.value / max) * 170)}px` }}
            />
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
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
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
