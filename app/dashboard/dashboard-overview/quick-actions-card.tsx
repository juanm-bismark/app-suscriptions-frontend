"use client"

import type { DashboardSubscriptionOverview } from "@/app/actions/dashboard"
import { ArrowRight, Loader2 } from "lucide-react"
import { dashboardStyles } from "../_components/dashboard-styles"
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
    <div className="rounded-lg bg-accent-soft p-4 text-ink-teal shadow-sm shadow-header-top/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-table-header-text">Acceso rápido</p>
          <h2 className="mt-2 text-xl font-semibold">
            {hasNoProviders ? "Configura tus credenciales" : overview?.needsImport ? "Activa el listado global" : "Gestiona tus suscripciones"}
          </h2>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-table-header-text" />}
      </div>
      <p className="mt-2 text-sm text-table-header-text">
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
        <PendingLinkButton href={subscriptionHref} className={dashboardStyles.primaryAction}>
          Ver suscripciones
          <ArrowRight className="h-4 w-4" />
        </PendingLinkButton>
        {overview?.needsImport && (
          <PendingLinkButton href="/dashboard/sims/import" className={dashboardStyles.softButton}>
            Importar SIMs
          </PendingLinkButton>
        )}
      </div>
    </div>
  )
}
