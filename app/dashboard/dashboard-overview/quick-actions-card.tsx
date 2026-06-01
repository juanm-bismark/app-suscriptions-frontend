"use client"

import type { DashboardSubscriptionOverview } from "@/app/actions/dashboard"
import { ArrowRight, Loader2 } from "lucide-react"
import { PendingLinkButton } from "../_components/pending-link-button"

export function QuickActionsCard({
  overview,
  isLoading,
  isError,
}: {
  overview?: DashboardSubscriptionOverview
  isLoading: boolean
  isError: boolean
}) {
  const hasNoProviders = overview?.activeProviders !== null && overview?.activeProviders.length === 0
  const subscriptionHref = overview?.activeProviders !== null && overview?.activeProviders.length === 1
    ? `/dashboard/subscriptions?provider=${overview.activeProviders[0]}`
    : "/dashboard/subscriptions"

  return (
    <div className="rounded-lg bg-gradient-to-br from-ink-teal via-header-bg to-action-soft p-4 text-white shadow-sm shadow-header-top/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Acceso rápido</p>
          <h2 className="mt-2 text-xl font-semibold">
            {hasNoProviders ? "Configura tus credenciales" : overview?.needsImport ? "Activa el listado global" : "Gestiona tus suscripciones"}
          </h2>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-white/80" />}
      </div>
      <p className="mt-2 text-sm text-white/80">
        {overview?.needsImport
          ? "Carga el mapa ICCID-proveedor inicial o entra por proveedor mientras preparas la importacion."
          : hasNoProviders
            ? "No hay credenciales activas para consultar suscripciones."
            : "Revisa el inventario sincronizado desde tus proveedores."}
      </p>
      {isError && (
        <p className="mt-2 rounded-md bg-warning-soft px-3 py-2 text-sm font-medium text-warning-text-soft shadow-sm shadow-warn-bg/5">
          No se pudo cargar el overview
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <PendingLinkButton
          href={subscriptionHref}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-ink-teal shadow-sm shadow-header-top/20 transition-colors hover:bg-accent-soft hover:text-ink-teal"
        >
          Ver suscripciones
          <ArrowRight className="h-4 w-4 text-current" />
        </PendingLinkButton>
        {overview?.needsImport && (
          <PendingLinkButton
            href="/dashboard/sims/import"
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm shadow-header-top/10 transition-colors hover:bg-white/20 hover:text-white"
          >
            Importar SIMs
          </PendingLinkButton>
        )}
      </div>
    </div>
  )
}
