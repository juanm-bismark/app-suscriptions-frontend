"use client"

import { getDashboardSubscriptionOverview } from "@/app/actions/dashboard"
import { loadSubscriptions } from "@/app/actions/subscriptions"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Database, RadioTower, ServerCog } from "lucide-react"
import { useEffect, useMemo } from "react"
import { providerDisplayName } from "@/lib/provider-meta"
import { MetricCard } from "./dashboard-overview/metric-card"
import { ProviderStatusCard } from "./dashboard-overview/provider-status-card"
import { QuickActionsCard } from "./dashboard-overview/quick-actions-card"
import { PROVIDERS, providerNames } from "./dashboard-overview/utils"

const STALE_TIME_MS = 5 * 60 * 1000

export function DashboardOverview() {
  const queryClient = useQueryClient()
  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardSubscriptionOverview,
  })

  useEffect(() => {
    if (!overview || isError) return
    if (overview.activeProviders === null) return

    for (const provider of overview.activeProviders) {
      queryClient.prefetchQuery({
        queryKey: ["subscriptions", provider, "", ""] as const,
        queryFn: async () => {
          const result = await loadSubscriptions({ provider, limit: 25 })
          if (!result.ok && result.kind === "error") throw new Error(result.error)
          return result
        },
        staleTime: STALE_TIME_MS,
      })
    }
  }, [isError, overview, queryClient])

  const topProvider = useMemo(() => {
    return overview?.providerHints
      .filter((item): item is typeof item & { count: number } => item.count !== null)
      .sort((a, b) => b.count - a.count)[0]
  }, [overview])

  const credentialReadable = overview?.activeProviders !== null
  const visibleProviders = overview?.activeProviders ?? PROVIDERS
  const activeProviderCount = overview ? visibleProviders.length : PROVIDERS.length
  const activeProviderNames = overview ? providerNames(visibleProviders) : "Kite, Tele2 y Moabits"

  const totalLabel = overview?.globalTotal !== null && overview?.globalTotal !== undefined
    ? String(overview.globalTotal)
    : overview?.activeProviders !== null && overview?.activeProviders.length === 0
      ? "Sin credenciales"
    : overview?.needsImport
      ? "Pendiente"
      : overview
        ? String(overview.providerTotalHint)
        : "--"

  const totalHelp = overview?.globalTotal !== null && overview?.globalTotal !== undefined
    ? "Listado global del backend"
    : overview?.activeProviders !== null && overview?.activeProviders.length === 0
      ? "Configura credenciales activas"
    : overview?.needsImport
      ? "Importa SIMs para activar el global"
      : overview
        ? "Estimado desde proveedores"
        : "Cargando datos"

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="h-full">
          <div className="grid h-full gap-3 sm:grid-cols-3">
            <MetricCard
              icon={<Database className="h-4 w-4" />}
              label="Suscripciones"
              value={totalLabel}
              help={totalHelp}
              loading={isLoading}
              tone="inventory"
            />
            <MetricCard
              icon={<RadioTower className="h-4 w-4" />}
              label="Proveedor principal"
              value={topProvider ? providerDisplayName(topProvider.provider) : overview ? "-" : "--"}
              help={topProvider ? `${topProvider.count} en la primera consulta` : "Sin datos disponibles"}
              loading={isLoading}
              tone="provider"
            />
            <MetricCard
              icon={<ServerCog className="h-4 w-4" />}
              label="Consultados"
              value={overview ? `${overview.providerHints.filter((item) => item.status !== "not_queried").length}/${activeProviderCount}` : "--"}
              help={overview?.activeProviders !== null && overview?.activeProviders.length === 0 ? "Sin proveedores disponibles" : overview?.providerHints.some((item) => item.status === "error" || item.status === "partial") ? "Hay fuentes con error o respuesta parcial" : overview?.providerHints.some((item) => item.status === "not_queried") ? "Hay fuentes fuera de este resumen" : activeProviderNames}
              loading={isLoading}
              tone="health"
            />
          </div>
        </div>

        <QuickActionsCard overview={overview} isLoading={isLoading} isError={isError} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(overview?.providerHints ?? PROVIDERS.map((provider) => ({ provider, count: null, partial: false, status: "loading" as const, error: null }))).map((item) => (
          <ProviderStatusCard key={item.provider} item={item} />
        ))}
        {credentialReadable && visibleProviders.length === 0 && (
          <div className="rounded-lg bg-panel-soft px-4 py-3 text-sm font-medium text-muted shadow-sm shadow-header-top/5 sm:col-span-3">
            Configura al menos una credencial activa para habilitar consultas por proveedor.
          </div>
        )}
      </div>
    </section>
  )
}
