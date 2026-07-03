"use client"

import type { CSSProperties } from "react"
import type { FailedProvider } from "@/lib/subscriptions/types"
import Link from "next/link"
import { EmptyState } from "../state-views"
import { Icon } from "../primitives"
import { PROVIDER_IDS } from "../filters/source-filter"
import { SOURCES, type SourceId } from "../tokens"

export function ListEmptyShell({ query }: { query?: string }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-page text-text">
      <div className="border-b border-border bg-card px-6 pb-4 pt-[22px]">
        <h1 className="m-0 text-[22px] font-bold text-title">Suscripciones</h1>
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
      className="inline-block animate-spin rounded-full border-2 border-(--spinner-color)/35 border-t-(--spinner-color)"
      style={{ width: size, height: size, "--spinner-color": color } as CSSProperties}
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
    <div
      role="status"
      className="mt-3.5 flex flex-wrap items-start gap-2.5 rounded-md border border-warning-action/35 bg-warning-soft px-3 py-2.5 text-[12.5px] leading-[1.45] text-warning-text-soft"
    >
      <span className="mt-px inline-flex text-warning-action"><Icon.warn size={14} /></span>
      <div className="flex-1">
        <div className="mb-[3px]">
          <strong className="font-extrabold">Mapa ICCID-fuente</strong>
        </div>
        {unresolved.length > 0 && (
          <div>
            <strong className="font-extrabold">{unresolved.length} ICCID sin fuente asignada.</strong>{" "}
            {isAdmin
              ? `Reconstruye el mapa de rutas de ${sourceLabel}; al terminar, la lista se actualiza sola.`
              : `Pide a un admin reconstruir el mapa de rutas de ${sourceLabel}.`}
          </div>
        )}
        {filteredOut.length > 0 && (
          <div className={unresolved.length ? "mt-[3px]" : undefined}>
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
          className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded border border-warning-action/35 bg-card px-2 py-[5px] text-xs font-extrabold text-warning-text-soft transition-colors hover:bg-warning-hover-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-action disabled:cursor-wait disabled:opacity-70"
        >
          {isRefreshingRouting && <InlineSpinner color="var(--color-warning-text-soft)" size={12} />}
          {isRefreshingRouting ? busyLabel : actionLabel}
        </button>
      )}
    </div>
  )
}

export function DetailsQueryNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mt-3.5 flex items-center gap-2.5 rounded-md border border-danger-action/25 bg-danger-tint px-3 py-2.5 text-[12.5px] text-danger-action"
    >
      <Icon.warn size={14} />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded border border-danger-action/25 bg-card px-2 py-[5px] text-xs font-extrabold text-danger-action transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-action"
      >
        Reintentar
      </button>
    </div>
  )
}

export function PartialProvidersNotice({ failedProviders }: { failedProviders: FailedProvider[] }) {
  const names = Array.from(new Set(failedProviders.map((f) => sourceName(f.provider)))).join(", ")
  return (
    <div
      role="status"
      className="mt-3.5 flex items-start gap-[9px] rounded-md border border-warning-action/35 bg-warning-soft px-3 py-2.5 text-[12.5px] leading-[1.45] text-warning-text-soft"
    >
      <span className="mt-px inline-flex text-warning-action">
        <Icon.warn size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="font-extrabold">Vista parcial.</strong> La tabla cargó, pero no se pudo consultar {names}.
        <div className="mt-0.5 font-mono text-[11.5px] text-muted">
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
      <div className="rounded-lg border border-warning-border-soft bg-warning-soft p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-warning-icon-soft">Mapa ICCID-fuente pendiente</p>
        <h1 className="mt-2 text-2xl font-bold text-title">Crea el mapa para activar la vista global</h1>
        <p className="mt-2 max-w-2xl text-sm text-warning-text-soft">
          La vista global necesita saber en que fuente vive cada ICCID. Importa el CSV inicial para crear ese mapa; si solo quieres consultar ahora, entra por un proveedor especifico.
        </p>
        {failedProviders.length > 0 && (
          <div className="mt-4 max-w-2xl rounded border border-warning-border-soft bg-white/70 p-3 text-sm text-warning-text-soft">
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
          <Link href={providerHref} className="rounded border border-warning-border-soft bg-card px-4 py-2 text-sm font-semibold text-warning-text-soft hover:bg-warning-hover-bg">
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
