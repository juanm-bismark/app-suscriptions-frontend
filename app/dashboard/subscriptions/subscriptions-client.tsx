"use client"

import { useSearchParams } from "next/navigation"
import { CSSProperties, useEffect, useMemo, useState } from "react"
import { DATA, fmtCOP, fmtShortDate, NOW_REFERENCE, SubscriptionRecord } from "./data"
import { DetailModal } from "./detail-modal"
import { Btn, Chip, Icon, SourceBadge, StatusPillWithNative, UsageBar } from "./primitives"
import { EmptyState, ErrorState, LoadingState } from "./state-views"
import { SOURCES, SourceId, STATUS_META, StatusId, T } from "./tokens"

const GRID_COLS = "4px 150px 1.1fr 0.95fr 130px 110px 130px 110px 100px 110px"

const cellH: CSSProperties = { padding: "9px 12px" }
const cell: CSSProperties = { padding: "9px 12px", minWidth: 0 }

type SourceFilter = SourceId | "all"
type StatusFilter = StatusId | "all"

export function SubscriptionsClient() {
  const searchParams = useSearchParams()
  const stateOverride = searchParams.get("state")
  if (stateOverride === "loading") return <LoadingState />
  if (stateOverride === "error") return <ErrorState />
  if (stateOverride === "empty") return <ListEmptyShell />

  return <SubscriptionsList />
}

// Used when ?state=empty — wraps EmptyState in the same chrome the live list uses.
function ListEmptyShell() {
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
      <EmptyState />
    </div>
  )
}

function SubscriptionsList() {
  const [q, setQ] = useState("")
  const [activeSrc, setActiveSrc] = useState<SourceFilter>("all")
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all")
  const [hovered, setHovered] = useState<string | null>(null)
  const [openRecord, setOpenRecord] = useState<SubscriptionRecord | null>(null)

  // Advanced filters drawer state
  const [advOpen, setAdvOpen] = useState(false)
  const [advSrcs, setAdvSrcs] = useState<Set<SourceId> | null>(null)
  const [advStatuses, setAdvStatuses] = useState<Set<StatusId> | null>(null)
  const [advCycles, setAdvCycles] = useState<Set<string> | null>(null)
  const [advAmount, setAdvAmount] = useState<{ min: string; max: string }>({ min: "", max: "" })
  const [advRenewal, setAdvRenewal] = useState<"any" | "7d" | "30d" | "overdue">("any")

  useEffect(() => {
    if (!advOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [advOpen])

  const matchesAdv = (r: SubscriptionRecord) => {
    if (advSrcs && advSrcs.size > 0 && !advSrcs.has(r.source)) return false
    if (advStatuses && advStatuses.size > 0 && !advStatuses.has(r.status)) return false
    if (advCycles && advCycles.size > 0 && !advCycles.has(r.cycle)) return false
    if (advAmount.min !== "" && r.amount < Number(advAmount.min)) return false
    if (advAmount.max !== "" && r.amount > Number(advAmount.max)) return false
    if (advRenewal !== "any") {
      if (advRenewal === "overdue" && r.status !== "overdue") return false
      if (advRenewal === "7d" || advRenewal === "30d") {
        const d = r.nextRenewal && r.nextRenewal !== "—" ? new Date(r.nextRenewal) : null
        if (!d) return false
        const days = (d.getTime() - new Date(NOW_REFERENCE).getTime()) / 86_400_000
        if (advRenewal === "7d" && (days < 0 || days > 7)) return false
        if (advRenewal === "30d" && (days < 0 || days > 30)) return false
      }
    }
    return true
  }

  const rows = useMemo(
    () =>
      DATA.filter(
        (r) =>
          (activeSrc === "all" || r.source === activeSrc) &&
          (activeStatus === "all" || r.status === activeStatus) &&
          (!q || (r.customer + r.plan + r.id).toLowerCase().includes(q.toLowerCase())) &&
          matchesAdv(r),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, activeSrc, activeStatus, advSrcs, advStatuses, advCycles, advAmount, advRenewal],
  )

  const advCount =
    (advSrcs && advSrcs.size > 0 ? 1 : 0) +
    (advStatuses && advStatuses.size > 0 ? 1 : 0) +
    (advCycles && advCycles.size > 0 ? 1 : 0) +
    (advAmount.min !== "" || advAmount.max !== "" ? 1 : 0) +
    (advRenewal !== "any" ? 1 : 0)

  const clearAdv = () => {
    setAdvSrcs(null)
    setAdvStatuses(null)
    setAdvCycles(null)
    setAdvAmount({ min: "", max: "" })
    setAdvRenewal("any")
  }

  const toggleInSet = <V,>(set: Set<V> | null, key: V): Set<V> => {
    const next = new Set(set ?? [])
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  }

  const sourceTabs = [
    { id: "all" as const, name: "Todas", color: T.headerBg, count: DATA.length },
    ...Object.values(SOURCES).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      count: DATA.filter((r) => r.source === s.id).length,
    })),
  ]

  const conicGradient =
    "conic-gradient(" +
    Object.values(SOURCES)
      .map((s, i, a) => `${s.color} ${(i * 100) / a.length}% ${((i + 1) * 100) / a.length}%`)
      .join(",") +
    ")"

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
      {/* Page header + searcher */}
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
            <Btn variant="outline" size="sm" icon={<Icon.refresh size={13} />}>
              Sincronizar
            </Btn>
            <Btn variant="primary" size="sm" icon={<Icon.plus size={12} />}>
              Nueva suscripción
            </Btn>
          </div>
        </div>

        {/* Searcher */}
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
            placeholder="Buscar por cliente, plan, ID, MSISDN o serial…"
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
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 10.5,
              color: T.muted,
              padding: "2px 6px",
              border: `1px solid ${T.border}`,
              borderRadius: 3,
            }}
          >
            ⌘ K
          </span>
        </div>

        {/* Source tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              fontSize: 11,
              color: T.muted,
              marginRight: 4,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
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
                  transition: "all .12s",
                }}
              >
                {!isAll && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: active ? "rgba(255,255,255,.22)" : t.color,
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: T.fontMono,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {t.name[0].toUpperCase()}
                  </span>
                )}
                {isAll && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: active ? "rgba(255,255,255,.18)" : T.tableHeaderBg,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: active ? "#fff" : "transparent",
                        backgroundImage: active ? undefined : conicGradient,
                      }}
                    />
                  </span>
                )}
                {t.name}
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 3,
                    lineHeight: 1.4,
                    background: active ? "rgba(255,255,255,.18)" : T.tableHeaderBg,
                    color: active ? "#fff" : T.muted,
                  }}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Status chips + advanced filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <div
              style={{
                fontSize: 11,
                color: T.muted,
                alignSelf: "center",
                marginRight: 4,
                fontWeight: 600,
                letterSpacing: 0.3,
              }}
            >
              ESTADO
            </div>
            <Chip active={activeStatus === "all"} onClick={() => setActiveStatus("all")}>
              Todos
            </Chip>
            {(["active", "paused", "overdue", "trial", "pending"] as StatusId[]).map((k) => (
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
              letterSpacing: 0.1,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Icon.filter size={13} />
            Filtros avanzados
            {advCount > 0 && (
              <span
                style={{
                  background: "#fff",
                  color: T.headerBg,
                  fontFamily: T.fontMono,
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "0 5px",
                  borderRadius: 8,
                  minWidth: 16,
                  textAlign: "center",
                  lineHeight: "15px",
                }}
              >
                {advCount}
              </span>
            )}
          </button>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: T.fontMono }}>
            {rows.length} resultado{rows.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Table */}
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
          <div style={cellH}>ID</div>
          <div style={cellH}>Cliente</div>
          <div style={cellH}>Plan</div>
          <div style={cellH}>Compañía</div>
          <div style={cellH}>Estado</div>
          <div style={cellH}>Consumo</div>
          <div style={{ ...cellH, textAlign: "right" }}>Monto</div>
          <div style={cellH}>Renovación</div>
          <div style={{ ...cellH, textAlign: "right", paddingRight: 16 }}>Detalle</div>
        </div>

        {rows.length === 0 && <EmptyState query={q || "tus filtros"} />}

        {rows.map((r, i) => {
          const src = SOURCES[r.source]
          const isHov = hovered === r.id
          return (
            <div
              key={r.id}
              onClick={() => setOpenRecord(r)}
              onMouseEnter={() => setHovered(r.id)}
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
                <SourceBadge source={r.source} size="sm" />
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11.5,
                    color: T.title,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.id}
                </span>
              </div>
              <div style={{ ...cell, display: "flex", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: T.title,
                      fontWeight: 600,
                      fontSize: 12.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.customer}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.muted,
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.customerEmail}
                  </div>
                </div>
              </div>
              <div
                style={{
                  ...cell,
                  color: T.text,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.plan}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>Desde {fmtShortDate(r.createdAt)}</div>
              </div>
              <div
                title={r.parent}
                style={{
                  ...cell,
                  fontSize: 11.5,
                  color: T.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {r.parent}
              </div>
              <div style={{ ...cell, display: "flex", alignItems: "center" }}>
                <StatusPillWithNative
                  status={r.status}
                  nativeStatus={r.nativeStatus}
                  sourceName={src.name}
                  size="sm"
                />
              </div>
              <div style={{ ...cell, display: "flex", alignItems: "center" }}>
                <UsageBar used={r.usage?.used} total={r.usage?.total} unit={r.usage?.unit} width={120} />
              </div>
              <div
                style={{
                  ...cell,
                  textAlign: "right",
                  fontFamily: T.fontMono,
                  fontSize: 12.5,
                  color: T.title,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                {fmtCOP(r.amount)}
              </div>
              <div style={{ ...cell, fontSize: 12, color: T.text, display: "flex", alignItems: "center" }}>
                {fmtShortDate(r.nextRenewal)}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenRecord(r)
                }}
                title="Ver detalle"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  paddingRight: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 11.5,
                    color: T.muted,
                    fontWeight: 600,
                    fontFamily: T.fontBody,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    borderRadius: 4,
                    background: "transparent",
                    transition: "background .12s",
                  }}
                >
                  Ver detalle <Icon.arrowRight size={11} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Advanced filters drawer */}
      {advOpen && (
        <>
          <div
            onClick={() => setAdvOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(15,30,40,.28)", zIndex: 60 }}
          />
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
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: T.tableHeaderBg,
              }}
            >
              <Icon.filter size={14} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.title, letterSpacing: -0.1 }}>
                Filtros avanzados
              </div>
              {advCount > 0 && (
                <span
                  style={{
                    background: T.headerBg,
                    color: "#fff",
                    fontFamily: T.fontMono,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 8,
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {advCount}
                </span>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setAdvOpen(false)}
                title="Cerrar"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.muted,
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 0,
                  borderRadius: 4,
                }}
              >
                <Icon.close size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
              {/* Sources */}
              <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
                FUENTES
              </div>
              {(() => {
                const drawerSel: Set<SourceId> =
                  advSrcs && advSrcs.size > 0
                    ? advSrcs
                    : activeSrc !== "all"
                      ? new Set([activeSrc as SourceId])
                      : new Set()
                const allChecked = drawerSel.size === 0 || drawerSel.size === Object.keys(SOURCES).length
                const toggleSrc = (id: SourceId) => {
                  const next = new Set(drawerSel)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  setActiveSrc("all")
                  if (next.size === 0 || next.size === Object.keys(SOURCES).length) setAdvSrcs(null)
                  else setAdvSrcs(next)
                }
                return (
                  <>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: allChecked ? T.tableHeaderBg : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => {
                          setActiveSrc("all")
                          setAdvSrcs(null)
                        }}
                        style={{ accentColor: T.headerBg }}
                      />
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: conicGradient,
                        }}
                      />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.title, flex: 1 }}>Todas</span>
                      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{DATA.length}</span>
                    </label>
                    {Object.values(SOURCES).map((s) => {
                      const checked = drawerSel.has(s.id) && !allChecked
                      return (
                        <label
                          key={s.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: checked ? s.tintBg : "transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSrc(s.id)}
                            style={{ accentColor: s.color }}
                          />
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: T.title, flex: 1 }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
                            {DATA.filter((r) => r.source === s.id).length}
                          </span>
                        </label>
                      )
                    })}
                  </>
                )
              })()}

              <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />

              {/* Status */}
              <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
                ESTADO
              </div>
              {(() => {
                const allKeys: StatusId[] = ["active", "paused", "overdue", "trial", "pending", "canceled"]
                const drawerSel: Set<StatusId> =
                  advStatuses && advStatuses.size > 0
                    ? advStatuses
                    : activeStatus !== "all"
                      ? new Set([activeStatus as StatusId])
                      : new Set()
                const allChecked = drawerSel.size === 0 || drawerSel.size === allKeys.length
                const toggleSt = (k: StatusId) => {
                  const next = new Set(drawerSel)
                  if (next.has(k)) next.delete(k)
                  else next.add(k)
                  setActiveStatus("all")
                  if (next.size === 0 || next.size === allKeys.length) setAdvStatuses(null)
                  else setAdvStatuses(next)
                }
                return (
                  <>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "5px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: allChecked ? T.tableHeaderBg : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => {
                          setActiveStatus("all")
                          setAdvStatuses(null)
                        }}
                        style={{ accentColor: T.headerBg }}
                      />
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.muted }} />
                      <span style={{ fontSize: 12, color: T.title, fontWeight: 600, flex: 1 }}>Todos</span>
                      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>{DATA.length}</span>
                    </label>
                    {allKeys.map((k) => {
                      const checked = drawerSel.has(k) && !allChecked
                      return (
                        <label
                          key={k}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "5px 8px",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSt(k)}
                            style={{ accentColor: T.headerAccent }}
                          />
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_META[k].dot }} />
                          <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{STATUS_META[k].label}</span>
                          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
                            {DATA.filter((r) => r.status === k).length}
                          </span>
                        </label>
                      )
                    })}
                  </>
                )
              })()}

              <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />

              {/* Cycle */}
              <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
                CICLO
              </div>
              {(["Mensual", "Semanal", "Anual"] as const).map((k) => {
                const checked = advCycles ? advCycles.has(k) : false
                return (
                  <label
                    key={k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 8px",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setAdvCycles((prev) => toggleInSet(prev, k))}
                      style={{ accentColor: T.headerAccent }}
                    />
                    <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{k}</span>
                  </label>
                )
              })}

              <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />

              {/* Amount */}
              <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
                MONTO (COP)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={advAmount.min}
                  onChange={(e) => setAdvAmount((a) => ({ ...a, min: e.target.value }))}
                  placeholder="mín"
                  inputMode="numeric"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "6px 8px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: T.fontMono,
                    color: T.text,
                    outline: "none",
                    background: "#fff",
                  }}
                />
                <input
                  value={advAmount.max}
                  onChange={(e) => setAdvAmount((a) => ({ ...a, max: e.target.value }))}
                  placeholder="máx"
                  inputMode="numeric"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "6px 8px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: T.fontMono,
                    color: T.text,
                    outline: "none",
                    background: "#fff",
                  }}
                />
              </div>

              <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />

              {/* Renewal */}
              <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
                RENOVACIÓN
              </div>
              {(
                [
                  { id: "any", label: "Cualquiera" },
                  { id: "7d", label: "Próximos 7 días" },
                  { id: "30d", label: "Próximos 30 días" },
                  { id: "overdue", label: "En mora" },
                ] as const
              ).map((o) => (
                <label
                  key={o.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="advRenewal"
                    checked={advRenewal === o.id}
                    onChange={() => setAdvRenewal(o.id)}
                    style={{ accentColor: T.headerAccent }}
                  />
                  <span style={{ fontSize: 12, color: T.text }}>{o.label}</span>
                </label>
              ))}
            </div>

            <div
              style={{
                padding: 12,
                borderTop: `1px solid ${T.border}`,
                display: "flex",
                gap: 8,
                background: T.cardBg,
              }}
            >
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

      {/* Footer */}
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
          Mostrando {rows.length} de {DATA.length}
        </span>
        <div style={{ flex: 1 }} />
        {Object.values(SOURCES).map((s) => (
          <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.success }} /> {s.name}
          </span>
        ))}
        <span>últ. sync hace 1 min</span>
      </div>

      <DetailModal record={openRecord} onClose={() => setOpenRecord(null)} />
    </div>
  )
}
