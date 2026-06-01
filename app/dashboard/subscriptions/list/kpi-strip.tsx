"use client"

import { loadSimStats } from "@/app/actions/subscriptions"
import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { Provider } from "@/lib/types/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type { AdvancedSubscriptionFilters } from "../filters/advanced-filters"
import { advancedFiltersQueryKey, advancedFiltersToLoadInput } from "../filters/advanced-filters"
import type { SourceFilter } from "../filters/source-filter"
import { statusKey } from "../filters/status-filter"
import { T } from "../tokens"
import type { ViewScope } from "./types"

const STALE_TIME_MS = 5 * 60 * 1000
const STALE_LU_MS = 30 * 24 * 60 * 60 * 1000

type KpiBucket = { key: string; label: string; count: number; tone: string }

const KPI_DEFINITIONS = {
  moabits: [
    { key: "active", label: "Activas", status: "active", tone: T.success, fuzzy: true },
    { key: "ready", label: "Ready", status: "ready", tone: T.headerAccent, fuzzy: true },
    { key: "suspended", label: "Suspendidas", status: "suspended", tone: T.danger, fuzzy: true },
  ],
  kite: [
    { key: "active", label: "ACTIVE", status: "active", tone: T.success },
    { key: "test", label: "TEST", status: "test", tone: T.headerAccent },
    { key: "activation_pendant", label: "Activation Pendant", status: "activation_pendant", tone: T.warning },
    { key: "inactive_new", label: "INACTIVE", status: "inactive_new", tone: T.muted },
  ],
  tele2: [
    { key: "activated", label: "ACTIVATED", status: "activated", tone: T.success },
    { key: "deactivated", label: "DEACTIVATED", status: "deactivated", tone: T.warning },
    { key: "purged", label: "PURGED", status: "purged", tone: T.danger },
    { key: "inventory", label: "INVENTORY", status: "inventory", tone: T.muted },
  ],
} as const

const GLOBAL_KPI_GROUPS = [
  { key: "active_like", label: "Activas", group: "active_like", tone: T.success },
  { key: "test_like", label: "Test", group: "test_like", tone: T.headerAccent },
  { key: "suspended_like", label: "Suspendidas/Inactivas", group: "suspended_like", tone: T.warning },
  { key: "purged_like", label: "Purgadas", group: "purged_like", tone: T.danger },
  { key: "terminal_like", label: "Terminales", group: "terminal_like", tone: T.muted },
] as const

export function KpiStrip({
  rows,
  scope,
  activeSrc,
  filters,
}: {
  rows: SubscriptionRow[]
  scope: ViewScope
  activeSrc: SourceFilter
  filters: AdvancedSubscriptionFilters
}) {
  const statsQuery = useQuery({
    queryKey: ["sim-stats", scope, activeSrc, advancedFiltersQueryKey(filters, activeSrc)] as const,
    queryFn: async () => {
      const result = await loadSimStats({
        scope,
        provider: activeSrc === "all" ? undefined : (activeSrc as Provider),
        ...advancedFiltersToLoadInput(filters, activeSrc),
      })
      if (!result.ok) throw new Error(result.error.detail || result.error.title || "No se pudieron cargar los KPIs")
      return result.data
    },
    retry: false,
    staleTime: STALE_TIME_MS,
  })
  const buckets = useMemo<KpiBucket[]>(
    () => statsQuery.data ? computeKpisFromStats(statsQuery.data, activeSrc) : computeKpis(rows, activeSrc),
    [activeSrc, rows, statsQuery.data],
  )
  const isInitialStatsLoading = statsQuery.isLoading && !statsQuery.data
  const isRefreshingStats = statsQuery.isFetching && !isInitialStatsLoading
  const displayBuckets = isInitialStatsLoading ? computeKpisFromStats({ total: 0, by_status: {}, stale_lu_count: 0 }, activeSrc) : buckets
  if (displayBuckets.length === 0) return null
  return (
    <div
      aria-busy={statsQuery.isFetching || undefined}
      aria-live="polite"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${displayBuckets.length}, minmax(120px, 1fr))`,
        gap: 1,
        background: T.border,
        borderRadius: 6,
        overflow: "hidden",
        marginTop: 16,
      }}
    >
      {displayBuckets.map((bucket) => (
        <div key={bucket.key} style={{ background: T.cardBg, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: bucket.tone, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, letterSpacing: 0.7, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>
              {bucket.label}
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.title, fontFamily: T.fontMono, letterSpacing: -0.3 }}>
            {isInitialStatsLoading ? <KpiCountSkeleton /> : bucket.count.toLocaleString("es-CO")}
          </div>
        </div>
      ))}
      {(isInitialStatsLoading || isRefreshingStats || statsQuery.isError || statsQuery.data?.partial) && (
        <div style={{ gridColumn: `1 / -1`, background: T.cardBg, color: T.muted, fontSize: 11.5, padding: "7px 12px", borderTop: `1px solid ${T.border}` }}>
          {isInitialStatsLoading
            ? "Cargando KPIs agregados..."
            : isRefreshingStats
              ? "Actualizando KPIs agregados..."
              : statsQuery.isError
                ? "KPIs de la página actual."
                : "Conteo aproximado, base parcial."}
        </div>
      )}
    </div>
  )
}

export function isStaleLu(value: string | null): boolean {
  if (!value) return true
  const ts = Date.parse(value)
  if (Number.isNaN(ts)) return true
  return Date.now() - ts > STALE_LU_MS
}

function KpiCountSkeleton() {
  return (
    <span
      className="animate-pulse"
      style={{
        display: "inline-block",
        width: 64,
        height: 25,
        borderRadius: 4,
        background: T.zebra,
        verticalAlign: "middle",
      }}
    />
  )
}

function computeKpisFromStats(stats: { total: number; by_status: Record<string, number>; stale_lu_count: number }, activeSrc: SourceFilter): KpiBucket[] {
  const total: KpiBucket = { key: "total", label: "Total líneas", count: stats.total, tone: T.headerBg }
  const staleLu: KpiBucket = { key: "stale-lu", label: "Sin LU reciente", count: stats.stale_lu_count, tone: T.warning }
  if (activeSrc === "all") return [total, staleLu]

  const definitions = KPI_DEFINITIONS[activeSrc]
  return [
    total,
    ...definitions.map((definition) => ({
      key: definition.key,
      label: definition.label,
      count: countStatsStatus(stats.by_status, definition.status, "fuzzy" in definition && definition.fuzzy),
      tone: definition.tone,
    })),
    staleLu,
  ]
}

function computeKpis(rows: SubscriptionRow[], activeSrc: SourceFilter): KpiBucket[] {
  if (rows.length === 0) return []

  const total: KpiBucket = { key: "total", label: "Total líneas", count: rows.length, tone: T.headerBg }
  const staleLu: KpiBucket = { key: "stale-lu", label: "Sin LU reciente", count: rows.filter((row) => isStaleLu(row.lastLuAt)).length, tone: T.warning }

  if (activeSrc !== "all") {
    return [
      total,
      ...KPI_DEFINITIONS[activeSrc].map((definition) => countByStatus(rows, definition.status, definition.label, definition.tone)),
      staleLu,
    ]
  }

  return [
    total,
    ...GLOBAL_KPI_GROUPS.map((definition) => countByGroup(rows, definition.group, definition.label, definition.tone)),
    staleLu,
  ]
}

function countStatsStatus(byStatus: Record<string, number>, statusValue: string, fuzzy: boolean) {
  if (fuzzy) {
    return Object.entries(byStatus).reduce((sum, [status, count]) => statusKey(status).includes(statusValue) ? sum + count : sum, 0)
  }
  return byStatus[statusValue.toUpperCase()] ?? byStatus[statusValue] ?? 0
}

function countByStatus(rows: SubscriptionRow[], statusValue: string, label: string, tone: string): KpiBucket {
  const key = statusValue.toLowerCase()
  const count = rows.filter((row) => (row.status || "").trim().toLowerCase() === key).length
  return { key: `status-${key}`, label, count, tone }
}

function countByGroup(rows: SubscriptionRow[], group: string, label: string, tone: string): KpiBucket {
  const count = rows.filter((row) => (row.statusGroup || "").toLowerCase() === group).length
  return { key: `group-${group}`, label, count, tone }
}
