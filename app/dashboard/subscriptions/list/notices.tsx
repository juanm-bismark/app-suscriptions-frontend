"use client"

import type { FailedProvider } from "@/lib/subscriptions/types"
import Link from "next/link"
import { EmptyState } from "../state-views"
import { Icon } from "../primitives"
import { PROVIDER_IDS } from "../filters/source-filter"
import { SOURCES, type SourceId, T } from "../tokens"

export function ListEmptyShell({ query }: { query?: string }) {
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
      <style>{`@keyframes bismark-inline-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ padding: "22px 24px 16px", borderBottom: `1px solid ${T.border}`, background: T.cardBg }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title }}>Suscripciones</h1>
      </div>
      <EmptyState query={query || "tus filtros"} />
    </div>
  )
}

export function NoActiveProvidersState() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="rounded-lg border border-border/45 bg-panel-soft p-6 shadow-sm shadow-header-top/5">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Sin proveedores activos</p>
        <h1 className="mt-2 text-2xl font-bold text-title">Configura credenciales para consultar SIMs</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Esta empresa no tiene credenciales activas de Kite, Tele2 o Moabits. Cuando haya una credencial activa, apareceran sus filtros y resultados.
        </p>
        <div className="mt-5">
          <Link href="/dashboard/credentials" className="rounded bg-header-bg px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Ir a credenciales
          </Link>
        </div>
      </div>
    </div>
  )
}

export function InlineSpinner({ color = "currentColor", size = 12 }: { color?: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}55`,
        borderTopColor: color,
        display: "inline-block",
        animation: "bismark-inline-spin .7s linear infinite",
      }}
    />
  )
}

export function DetailsResolutionNotice({
  unresolved,
  filteredOut,
  activeProvider,
  isAdmin,
  onRefreshRouting,
  isRefreshingRouting = false,
}: {
  unresolved: string[]
  filteredOut: string[]
  activeProvider?: SourceId
  isAdmin: boolean
  onRefreshRouting?: () => void
  isRefreshingRouting?: boolean
}) {
  const sourceLabel = activeProvider ? SOURCES[activeProvider].name : "la fuente seleccionada"
  const actionLabel = activeProvider ? `Reconstruir rutas de ${sourceLabel}` : "Reconstruir rutas"
  const busyLabel = activeProvider ? `Reconstruyendo rutas de ${sourceLabel}...` : "Reconstruyendo rutas..."

  return (
    <div style={{ marginTop: 14, border: `1px solid ${T.warning}55`, background: "#FDF4E1", color: "#6B4A0E", borderRadius: 6, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.45, display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
      <span style={{ color: T.warning, display: "inline-flex", marginTop: 1 }}><Icon.warn size={14} /></span>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 3 }}>
          <strong style={{ fontWeight: 800 }}>Mapa ICCID-fuente</strong>
        </div>
        {unresolved.length > 0 && (
          <div>
            <strong style={{ fontWeight: 800 }}>{unresolved.length} ICCID sin fuente asignada.</strong>{" "}
            {isAdmin
              ? `Reconstruye el mapa de rutas de ${sourceLabel}; al terminar, la lista se actualiza sola.`
              : `Pide a un admin reconstruir el mapa de rutas de ${sourceLabel}.`}
          </div>
        )}
        {filteredOut.length > 0 && (
          <div style={{ marginTop: unresolved.length ? 3 : 0 }}>
            {filteredOut.length} ICCID pertenecen a otra fuente y quedan fuera del filtro{activeProvider ? ` ${sourceLabel}` : ""}.
          </div>
        )}
      </div>
      {onRefreshRouting && (
        <button
          type="button"
          onClick={onRefreshRouting}
          disabled={isRefreshingRouting}
          aria-busy={isRefreshingRouting || undefined}
          title="Reconstruye el mapa ICCID-fuente."
          style={{ border: `1px solid ${T.warning}55`, background: "#fff", color: "#6B4A0E", borderRadius: 4, padding: "5px 8px", fontSize: 12, fontWeight: 800, cursor: isRefreshingRouting ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, opacity: isRefreshingRouting ? 0.72 : 1, maxWidth: "100%" }}
        >
          {isRefreshingRouting && <InlineSpinner color="#6B4A0E" size={12} />}
          {isRefreshingRouting ? busyLabel : actionLabel}
        </button>
      )}
    </div>
  )
}

export function DetailsQueryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ marginTop: 14, border: `1px solid ${T.dangerBorderSoft}`, background: T.dangerTint, color: T.danger, borderRadius: 6, padding: "10px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 10 }}>
      <Icon.warn size={14} />
      <span style={{ flex: 1 }}>{message}</span>
      <button type="button" onClick={onRetry} style={{ border: `1px solid ${T.dangerBorderSoft}`, background: "#fff", color: T.danger, borderRadius: 4, padding: "5px 8px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
        Reintentar
      </button>
    </div>
  )
}

export function PartialProvidersNotice({ failedProviders }: { failedProviders: FailedProvider[] }) {
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
        <strong style={{ fontWeight: 800 }}>Vista parcial.</strong> La tabla cargó, pero no se pudo consultar {names}.
        <div style={{ color: T.muted, fontSize: 11.5, marginTop: 2, fontFamily: T.fontMono }}>
          {failedProviders.map((f) => `${sourceName(f.provider)}: ${f.title || f.code}`).join(" · ")}
        </div>
      </div>
    </div>
  )
}

export function RoutingMapEmptyState({
  failedProviders = [],
  activeProviders = PROVIDER_IDS,
}: {
  failedProviders?: FailedProvider[]
  activeProviders?: SourceId[]
}) {
  const providerHref = activeProviders.length > 0
    ? `/dashboard/subscriptions?provider=${activeProviders[0]}`
    : "/dashboard/subscriptions"

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Mapa ICCID-fuente pendiente</p>
        <h1 className="mt-2 text-2xl font-bold text-title">Crea el mapa para activar la vista global</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-900">
          La vista global necesita saber en que fuente vive cada ICCID. Importa el CSV inicial para crear ese mapa; si solo quieres consultar ahora, entra por un proveedor especifico.
        </p>
        {failedProviders.length > 0 && (
          <div className="mt-4 max-w-2xl rounded border border-amber-300 bg-white/70 p-3 text-sm text-amber-950">
            <p className="font-semibold">Fuentes que no respondieron al intentar crear el mapa:</p>
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
            Crear mapa con CSV
          </Link>
          <Link href={providerHref} className="rounded border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            Consultar una fuente
          </Link>
        </div>
      </div>
    </div>
  )
}

function sourceName(provider: string) {
  return provider in SOURCES ? SOURCES[provider as SourceId].name : provider
}
