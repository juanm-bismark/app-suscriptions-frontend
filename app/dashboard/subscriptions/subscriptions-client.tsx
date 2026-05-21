"use client"

import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import type { FailedProvider, LoadSubscriptionsData, LoadSubscriptionsInput, LoadSubscriptionsResult } from "@/app/actions/subscriptions"
import { loadSubscriptions } from "@/app/actions/subscriptions"
import { useQueries, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react"
import { fmtShortDate } from "./data"
import { DetailModal } from "./detail-modal"
import { Btn, Chip, Icon, SourceBadge, StatusPillWithNative } from "./primitives"
import { EmptyState, ErrorState, LoadingState } from "./state-views"
import { SOURCES, SourceId, STATUS_META, StatusId, T } from "./tokens"

const PROVIDER_IDS = Object.keys(SOURCES) as SourceId[]
const SEARCHABLE_PROVIDER_IDS: SourceId[] = ["kite", "tele2"]
const STALE_TIME_MS = 5 * 60 * 1000

const GRID_COLS = "4px 170px 1.1fr 1fr 0.95fr 170px 120px 120px 100px"
const cellH: CSSProperties = { padding: "9px 12px" }
const cell: CSSProperties = { padding: "9px 12px", minWidth: 0 }
const STATUS_FILTERS: StatusId[] = ["active", "in_test", "suspended", "terminated", "purged", "pending"]

type SourceFilter = SourceId | "all"
type StatusFilter = StatusId | "all"
type QueryScope = SourceId | "global"

function isSourceId(value: string | undefined): value is SourceId {
  return !!value && value in SOURCES
}

function isStatusId(value: string | undefined): value is StatusId {
  return !!value && value in STATUS_META
}

function isExactIccidQuery(value: string) {
  return /^\d{18,22}$/.test(value.trim())
}

function scopesForQuery(selectedProvider: SourceId | undefined, query: string): QueryScope[] {
  if (selectedProvider) return [selectedProvider]
  if (isExactIccidQuery(query)) return ["global"]
  return query.trim() ? SEARCHABLE_PROVIDER_IDS : PROVIDER_IDS
}

function mergeRow(existing: SubscriptionRow | undefined, incoming: SubscriptionRow) {
  if (!existing) return incoming
  return {
    ...existing,
    ...incoming,
    msisdn: incoming.msisdn ?? existing.msisdn,
    imsi: incoming.imsi ?? existing.imsi,
    nativeStatus: incoming.nativeStatus || existing.nativeStatus,
    customerName: incoming.customerName ?? existing.customerName,
    customerScope: incoming.customerScope ?? existing.customerScope,
    planName: incoming.planName ?? existing.planName,
    planCode: incoming.planCode ?? existing.planCode,
    activatedAt: incoming.activatedAt ?? existing.activatedAt,
    updatedAt: incoming.updatedAt ?? existing.updatedAt,
    detailLevel: incoming.detailLevel === "detail" ? "detail" : existing.detailLevel,
  }
}

function mergeRowsIntoResult(cached: LoadSubscriptionsData, incomingRows: SubscriptionRow[]): LoadSubscriptionsData {
  const rowsByKey = new Map(cached.rows.map((row) => [`${row.provider}:${row.iccid}`, row]))
  const nextRows = [...cached.rows]

  for (const incoming of incomingRows) {
    const key = `${incoming.provider}:${incoming.iccid}`
    const index = nextRows.findIndex((row) => `${row.provider}:${row.iccid}` === key)
    const merged = mergeRow(rowsByKey.get(key), incoming)

    if (index >= 0) {
      nextRows[index] = merged
    } else {
      nextRows.unshift(merged)
    }
    rowsByKey.set(key, merged)
  }

  return {
    ...cached,
    rows: nextRows,
    pagination: {
      ...cached.pagination,
      total: cached.pagination.total == null ? cached.pagination.total : Math.max(cached.pagination.total, nextRows.length),
    },
  }
}

export function SubscriptionsClient({ filters, isAdmin = false }: { filters?: LoadSubscriptionsInput; isAdmin?: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const retry = () => router.refresh()
  const stateOverride = searchParams.get("state")
  if (stateOverride === "loading") return <LoadingState query={filters?.q || undefined} />
  if (stateOverride === "error") return <ErrorState query={filters?.q || undefined} onRetry={retry} />
  if (stateOverride === "empty") return <ListEmptyShell query={filters?.q || undefined} />
  return <SubscriptionsLoader filters={filters} isAdmin={isAdmin} />
}

function SubscriptionsLoader({ filters, isAdmin }: { filters?: LoadSubscriptionsInput; isAdmin?: boolean }) {
  const queryClient = useQueryClient()
  const q = filters?.q ?? ""
  const cursor = filters?.cursor ?? ""
  const selectedProvider = isSourceId(filters?.provider) ? filters.provider : undefined
  const selectedStatus = isStatusId(filters?.status) ? filters.status : undefined
  const queryScopes = useMemo(() => scopesForQuery(selectedProvider, q), [q, selectedProvider])
  const listFilters: LoadSubscriptionsData["filters"] = {
    provider: selectedProvider,
    status: selectedStatus,
    cursor,
    q,
  }

  const results = useQueries({
    queries: queryScopes.map((scope) => ({
      queryKey: ["subscriptions", scope, q, cursor] as const,
      queryFn: async () => {
        const provider = scope === "global" ? undefined : scope
        const result = await loadSubscriptions({ provider, q: filters?.q, cursor: filters?.cursor, limit: 25 })
        if (!result.ok && result.kind === "error") throw new Error(result.error)
        return result
      },
      retry: false,
      staleTime: STALE_TIME_MS,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const allFailed = results.every((r) => r.isError || (r.data && !r.data.ok))
  const { allRows, failedProviders, providerStatuses, hasPartial } = useMemo(() => {
    const rows: SubscriptionRow[] = []
    const failed: FailedProvider[] = []
    const statuses: LoadSubscriptionsData["pagination"]["providerStatuses"] = []
    let partial = false

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.data?.ok) {
        rows.push(...(r.data.data.rows ?? []))
        failed.push(...(r.data.data.pagination.failedProviders ?? []))
        statuses.push(...(r.data.data.pagination.providerStatuses ?? []))
        if (r.data.data.pagination.partial) partial = true
      } else if (r.isError || (r.data && !r.data.ok)) {
        failed.push({
          provider: queryScopes[i],
          code: "provider.unavailable",
          title: r.isError ? (r.error instanceof Error ? r.error.message : "No se pudo consultar") : "No se pudo consultar",
        })
      }
    }

    return { allRows: rows, failedProviders: failed, providerStatuses: statuses, hasPartial: partial }
  }, [queryScopes, results])

  useEffect(() => {
    if (!q.trim() || allRows.length === 0) return

    for (const provider of PROVIDER_IDS) {
      const providerRows = allRows.filter((row) => row.provider === provider)
      if (providerRows.length === 0) continue

      queryClient.setQueryData<LoadSubscriptionsResult>(["subscriptions", provider, "", ""], (cached) => {
        if (!cached?.ok) return cached
        return {
          ...cached,
          data: mergeRowsIntoResult(cached.data, providerRows),
        }
      })
    }
  }, [allRows, q, queryClient])

  if (isLoading) return <LoadingState query={filters?.q || undefined} />

  if (allFailed) {
    const routingEmpty = results.find((r) => r.data && !r.data.ok && r.data.kind === "routing_map_empty")
    if (routingEmpty?.data && !routingEmpty.data.ok && routingEmpty.data.kind === "routing_map_empty") {
      return <RoutingMapEmptyState failedProviders={routingEmpty.data.failedProviders} />
    }
    return (
      <SubscriptionsList
        key={`${selectedProvider ?? "all"}:${filters?.status ?? ""}:${q}`}
        rows={[]}
        pagination={{ nextCursor: null, total: 0, partial: true, failedProviders, providerStatuses: [] }}
        filters={listFilters}
        initialSource={selectedProvider ?? "all"}
        isAdmin={isAdmin}
      />
    )
  }

  const initialSource: SourceFilter = selectedProvider ?? "all"

  return (
    <SubscriptionsList
      key={`${initialSource}:${filters?.status ?? ""}:${q}`}
      rows={allRows}
      pagination={{ nextCursor: null, total: allRows.length, partial: hasPartial || failedProviders.length > 0, failedProviders, providerStatuses }}
      filters={listFilters}
      initialSource={initialSource}
      isAdmin={isAdmin}
    />
  )
}

function ListEmptyShell({ query }: { query?: string }) {
  return (
    <div
      style={{
        background: T.pageBg,
        fontFamily: T.fontBody,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title }}>Suscripciones</h1>
      </div>
      <EmptyState query={query || "tus filtros"} />
    </div>
  )
}

function replaceParam(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}

function secondary(value: string | null | undefined) {
  return value && value.trim() ? value : "—"
}

function SubscriptionsList({
  rows: initialRows,
  pagination,
  filters,
  initialSource = "all",
  isAdmin = false,
}: {
  rows: SubscriptionRow[]
  pagination: LoadSubscriptionsData["pagination"]
  filters: LoadSubscriptionsData["filters"]
  initialSource?: SourceFilter
  isAdmin?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const filterQ = filters?.q ?? ""
  const filterStatus = isStatusId(filters?.status) ? filters.status : "all"
  const [q, setQ] = useState(filterQ)
  const [activeSrc, setActiveSrc] = useState<SourceFilter>(initialSource)
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(filterStatus)
  const [hovered, setHovered] = useState<string | null>(null)
  const [openRecord, setOpenRecord] = useState<SubscriptionRow | null>(null)
  const [advOpen, setAdvOpen] = useState(false)
  const [advSrcs, setAdvSrcs] = useState<Set<SourceId> | null>(null)
  const [advStatuses, setAdvStatuses] = useState<Set<StatusId> | null>(null)
  const [advPlan, setAdvPlan] = useState("")
  const [advClient, setAdvClient] = useState("")

  useEffect(() => {
    if (!advOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [advOpen])

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    replaceParam(params, "provider", activeSrc === "all" ? null : activeSrc)
    replaceParam(params, "status", activeStatus === "all" ? null : activeStatus)
    replaceParam(params, "q", q.trim() || null)
    params.delete("cursor")
    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false })
  }, [activeSrc, activeStatus, pathname, q, router, searchParams])

  const rows = useMemo(
    () =>
      initialRows.filter((r) => {
        if (activeSrc !== "all" && r.provider !== activeSrc) return false
        if (activeStatus !== "all" && r.status !== activeStatus) return false
        if (advSrcs && advSrcs.size > 0 && !advSrcs.has(r.provider)) return false
        if (advStatuses && advStatuses.size > 0 && !advStatuses.has(r.status as StatusId)) return false
        const planQ = advPlan.trim().toLowerCase()
        if (planQ && !`${r.planName ?? ""} ${r.planCode ?? ""}`.toLowerCase().includes(planQ)) return false
        const clientQ = advClient.trim().toLowerCase()
        if (clientQ && !`${r.customerName ?? ""} ${r.customerScope ?? ""}`.toLowerCase().includes(clientQ)) return false
        if (!q.trim()) return true
        const haystack = [r.iccid, r.msisdn, r.imsi, r.nativeStatus, r.provider]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(q.trim().toLowerCase())
      }),
    [activeSrc, activeStatus, advClient, advPlan, advSrcs, advStatuses, initialRows, q],
  )

  const advCount = (advSrcs && advSrcs.size > 0 ? 1 : 0) + (advStatuses && advStatuses.size > 0 ? 1 : 0) + (advPlan.trim() ? 1 : 0) + (advClient.trim() ? 1 : 0)
  const total = pagination?.total ?? initialRows.length
  const failedProviders = pagination?.failedProviders ?? []
  const hasPartialProviders = Boolean(pagination?.partial && failedProviders.length)

  const sourceTabs = [
    { id: "all" as const, name: "Todas", color: T.headerBg },
    ...Object.values(SOURCES).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
    })),
  ]

  const conicGradient =
    "conic-gradient(" +
    Object.values(SOURCES)
      .map((s, i, a) => `${s.color} ${(i * 100) / a.length}% ${((i + 1) * 100) / a.length}%`)
      .join(",") +
    ")"

  const clearAdv = () => {
    setAdvSrcs(null)
    setAdvStatuses(null)
    setAdvPlan("")
    setAdvClient("")
  }

  const allSelected = <V,>(set: Set<V> | null, options: readonly V[]) => !set || set.size === options.length
  const visibleSet = <V,>(set: Set<V> | null, options: readonly V[]) => set ?? new Set(options)
  const normalizeSet = <V,>(set: Set<V>, options: readonly V[]) => (set.size === 0 || set.size === options.length ? null : set)
  const toggleInSet = <V,>(set: Set<V> | null, key: V, options: readonly V[]): Set<V> | null => {
    const next = new Set(set ?? options)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return normalizeSet(next, options)
  }

  function handleSincronizar() {
    if (activeSrc === "all") {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    } else {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", activeSrc] })
    }
  }

  return (
    <div
      style={{
        background: T.pageBg,
        fontFamily: T.fontBody,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        minHeight: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.2,
                color: T.muted,
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Búsqueda unificada
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: -0.4 }}>
              Suscripciones
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline" size="sm" icon={<Icon.refresh size={13} />} onClick={handleSincronizar}>
              Sincronizar
            </Btn>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: T.pageBg,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "9px 12px",
          }}
        >
          <span style={{ color: T.muted, display: "inline-flex" }}>
            <Icon.search size={15} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por ICCID, MSISDN o IMSI..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13.5,
              fontFamily: T.fontBody,
              color: T.text,
            }}
          />
          {q.trim() && (
            <button
              type="button"
              onClick={() => setQ("")}
              title="Limpiar busqueda"
              style={{
                border: "none",
                background: "transparent",
                color: T.muted,
                cursor: "pointer",
                lineHeight: 0,
                padding: 4,
                borderRadius: 4,
              }}
            >
              <Icon.close size={14} />
            </button>
          )}
        </div>

        {q.trim() && !isExactIccidQuery(q.trim()) && activeSrc === "all" && (
          <p style={{ fontSize: 12, color: T.muted, margin: "6px 0 0", lineHeight: 1.4 }}>
            La búsqueda por texto aplica solo a Kite y Tele2. Moabits no admite filtros de texto — selecciona la fuente Moabits para buscarlo directamente.
          </p>
        )}

        <div style={{ display: "flex", gap: 6, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
            Fuente
          </div>
          {sourceTabs.map((t) => {
            const active = activeSrc === t.id
            const isAll = t.id === "all"
            return (
              <button
                key={t.id}
                onClick={() => setActiveSrc(t.id)}
                style={{
                  padding: "6px 11px 6px 9px",
                  background: active ? t.color : "#fff",
                  border: `1px solid ${active ? t.color : T.border}`,
                  borderRadius: 4,
                  color: active ? "#fff" : T.title,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: T.fontBody,
                  letterSpacing: -0.1,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: isAll ? "50%" : 3,
                    backgroundColor: active ? "rgba(255,255,255,.18)" : isAll ? "transparent" : t.color,
                    backgroundImage: !active && isAll ? conicGradient : undefined,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: T.fontMono,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {!isAll ? t.name[0].toUpperCase() : ""}
                </span>
                {t.name}
              </button>
            )
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: T.muted, alignSelf: "center", marginRight: 4, fontWeight: 600, letterSpacing: 0.3 }}>
              ESTADO
            </div>
            <Chip active={activeStatus === "all"} onClick={() => setActiveStatus("all")}>
              Todos
            </Chip>
            {STATUS_FILTERS.map((k) => (
              <Chip key={k} active={activeStatus === k} onClick={() => setActiveStatus(k)}>
                {STATUS_META[k].label}
              </Chip>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setAdvOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 11px",
              borderRadius: 4,
              border: `1px solid ${advCount > 0 ? T.headerBg : T.border}`,
              background: advCount > 0 ? T.headerBg : "#fff",
              color: advCount > 0 ? "#fff" : T.text,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: T.fontBody,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Icon.filter size={13} />
            Filtros avanzados
            {advCount > 0 && <span style={{ background: "#fff", color: T.headerBg, fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700, padding: "0 5px", borderRadius: 8, minWidth: 16, textAlign: "center", lineHeight: "15px" }}>{advCount}</span>}
          </button>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: T.fontMono }}>
            {rows.length} resultado{rows.length !== 1 ? "s" : ""}
          </div>
        </div>

        {hasPartialProviders && <PartialProvidersNotice failedProviders={failedProviders} />}
      </div>

      <div style={{ flex: 1, overflow: "auto", background: T.cardBg, position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
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
          <div style={cellH}>ICCID</div>
          <div style={cellH}>Identidad</div>
          <div style={cellH}>Plan</div>
          <div style={cellH}>Cliente</div>
          <div style={cellH}>Estado</div>
          <div style={cellH}>Operador</div>
          <div style={cellH}>Última actualización</div>
          <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }}>Detalle</div>
        </div>

        {rows.length === 0 && <EmptyState query={q || "tus filtros"} source={activeSrc} failedProviders={failedProviders} />}

        {rows.map((r, i) => {
          const src = SOURCES[r.provider]
          const isHov = hovered === r.iccid
          return (
            <div
              key={r.iccid}
              onClick={() => setOpenRecord(r)}
              onMouseEnter={() => setHovered(r.iccid)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                alignItems: "stretch",
                background: isHov ? T.zebra : i % 2 ? T.zebra : T.cardBg,
                borderBottom: `1px solid ${T.rowDivider}`,
                cursor: "pointer",
                transition: "background .12s",
                fontSize: 12.5,
              }}
            >
              <div style={{ background: src.color }} />
              <div style={{ ...cell, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 11.5, color: T.title, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.iccid}
                </span>
              </div>
              <StackCell top={secondary(r.msisdn)} bottom={secondary(r.imsi)} mono />
              <StackCell top={secondary(r.planName)} bottom={secondary(r.planCode)} />
              <StackCell top={secondary(r.customerName)} bottom={secondary(r.customerScope)} />
              <div style={{ ...cell, display: "flex", alignItems: "center" }}>
                <StatusPillWithNative status={r.status} nativeStatus={r.nativeStatus} sourceName={src.name} size="sm" />
              </div>
              <div style={{ ...cell, display: "flex", alignItems: "center", gap: 8 }}>
                <SourceBadge source={r.provider} size="sm" />
                <span style={{ fontSize: 12, color: T.title, fontWeight: 600 }}>{src.shortName}</span>
              </div>
              <div style={{ ...cell, fontSize: 12, color: T.text, display: "flex", alignItems: "center" }}>
                {fmtShortDate(r.updatedAt)}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenRecord(r)
                }}
                title="Ver detalle"
                style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: 12 }}
              >
                <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600, fontFamily: T.fontBody, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 4 }}>
                  Ver detalle <Icon.arrowRight size={11} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {advOpen && (
        <>
          <div onClick={() => setAdvOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,30,40,.28)", zIndex: 60 }} />
          <aside
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "min(320px, 92vw)",
              background: T.cardBg,
              borderRight: `1px solid ${T.border}`,
              boxShadow: "12px 0 32px rgba(20,40,50,.10)",
              zIndex: 61,
              display: "flex",
              flexDirection: "column",
              fontFamily: T.fontBody,
            }}
          >
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, background: T.tableHeaderBg }}>
              <Icon.filter size={14} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.title, letterSpacing: -0.1 }}>Filtros avanzados</div>
              <div style={{ flex: 1 }} />
              <button onClick={() => setAdvOpen(false)} title="Cerrar" style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", padding: 4, lineHeight: 0, borderRadius: 4 }}>
                <Icon.close size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
              <DrawerGroup title="FUENTES">
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: allSelected(advSrcs, PROVIDER_IDS) ? T.tableHeaderBg : "transparent" }}>
                  <input type="checkbox" checked={allSelected(advSrcs, PROVIDER_IDS)} onChange={() => setAdvSrcs(null)} style={{ accentColor: T.headerBg }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundImage: conicGradient }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: T.title, flex: 1 }}>Todas</span>
                  <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{initialRows.length}</span>
                </label>
                {Object.values(SOURCES).map((s) => {
                  const checked = visibleSet(advSrcs, PROVIDER_IDS).has(s.id)
                  return (
                    <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", background: checked ? s.tintBg : "transparent" }}>
                      <input type="checkbox" checked={checked} onChange={() => setAdvSrcs((prev) => toggleInSet(prev, s.id, PROVIDER_IDS))} style={{ accentColor: s.color }} />
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.title, flex: 1 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{initialRows.filter((r) => r.provider === s.id).length}</span>
                    </label>
                  )
                })}
              </DrawerGroup>
              <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />
              <DrawerGroup title="ESTADO">
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 4, cursor: "pointer", background: allSelected(advStatuses, STATUS_FILTERS) ? T.tableHeaderBg : "transparent" }}>
                  <input type="checkbox" checked={allSelected(advStatuses, STATUS_FILTERS)} onChange={() => setAdvStatuses(null)} style={{ accentColor: T.headerAccent }} />
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.headerAccent }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.title, flex: 1 }}>Todos</span>
                  <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{initialRows.length}</span>
                </label>
                {STATUS_FILTERS.map((k) => {
                  const checked = visibleSet(advStatuses, STATUS_FILTERS).has(k)
                  return (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 4, cursor: "pointer" }}>
                      <input type="checkbox" checked={checked} onChange={() => setAdvStatuses((prev) => toggleInSet(prev, k, STATUS_FILTERS))} style={{ accentColor: T.headerAccent }} />
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_META[k].dot }} />
                      <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{STATUS_META[k].label}</span>
                      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{initialRows.filter((r) => r.status === k).length}</span>
                    </label>
                  )
                })}
              </DrawerGroup>
            </div>

            <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, background: T.cardBg }}>
              <Btn variant="ghost" size="sm" onClick={clearAdv}>
                Limpiar
              </Btn>
              <div style={{ flex: 1 }} />
              <Btn variant="primary" size="sm" onClick={() => setAdvOpen(false)}>
                Aplicar · {rows.length}
              </Btn>
            </div>
          </aside>
        </>
      )}

      <div
        style={{
          padding: "8px 24px",
          background: T.cardBg,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 11.5,
          color: T.muted,
          fontFamily: T.fontMono,
          flexWrap: "wrap",
        }}
      >
        <span>
          Mostrando {rows.length} de {total}
        </span>
        {pagination?.partial && <span>{hasPartialProviders ? "respuesta parcial por fuente" : "respuesta parcial"}</span>}
        <div style={{ flex: 1 }} />
        {pagination?.nextCursor && <span>siguiente cursor disponible</span>}
      </div>

      <DetailModal
        record={openRecord}
        selectedProvider={activeSrc === "all" ? undefined : activeSrc}
        onClose={() => setOpenRecord(null)}
      />
    </div>
  )
}

function PartialProvidersNotice({ failedProviders }: { failedProviders: FailedProvider[] }) {
  const names = Array.from(new Set(failedProviders.map((f) => sourceName(f.provider)))).join(", ")
  return (
    <div
      style={{
        marginTop: 14,
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        border: `1px solid ${T.warning}55`,
        background: "#FDF4E1",
        color: "#6B4A0E",
        borderRadius: 6,
        padding: "10px 12px",
        fontSize: 12.5,
        lineHeight: 1.45,
      }}
    >
      <span style={{ color: T.warning, display: "inline-flex", marginTop: 1 }}>
        <Icon.warn size={14} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontWeight: 800 }}>Vista parcial.</strong> No se pudo consultar {names}.
        <div style={{ color: T.muted, fontSize: 11.5, marginTop: 2, fontFamily: T.fontMono }}>
          {failedProviders.map((f) => `${sourceName(f.provider)}: ${f.title || f.code}`).join(" · ")}
        </div>
      </div>
    </div>
  )
}

function sourceName(provider: string) {
  return provider in SOURCES ? SOURCES[provider as SourceId].name : provider
}

function StackCell({ top, bottom, mono }: { top: string; bottom: string; mono?: boolean }) {
  return (
    <div style={{ ...cell, display: "flex", alignItems: "center" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: T.title, fontWeight: 600, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: mono ? T.fontMono : T.fontBody }}>
          {top}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: mono ? T.fontMono : T.fontBody }}>
          {bottom}
        </div>
      </div>
    </div>
  )
}

function DrawerGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function RoutingMapEmptyState({ failedProviders = [] }: { failedProviders?: FailedProvider[] }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Listado global pendiente</p>
        <h1 className="mt-2 text-2xl font-bold text-title">Importa SIMs para activar la vista global</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-900">
          El backend aun no tiene mapa de enrutamiento ICCID-proveedor. Puedes cargar un CSV inicial o revisar un proveedor especifico.
        </p>
        {failedProviders.length > 0 && (
          <div className="mt-4 max-w-2xl rounded border border-amber-300 bg-white/70 p-3 text-sm text-amber-950">
            <p className="font-semibold">Fuentes que no respondieron durante el bootstrap:</p>
            <ul className="mt-2 space-y-1">
              {failedProviders.map((f, index) => (
                <li key={`${f.provider}-${f.code}-${index}`}>
                  <span className="font-mono">{f.provider}</span>: {f.title || f.code}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard/sims/import" className="rounded bg-header-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Importar SIMs
          </Link>
          <Link href="/dashboard/subscriptions?provider=kite" className="rounded border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            Ver por proveedor
          </Link>
        </div>
      </div>
    </div>
  )
}
