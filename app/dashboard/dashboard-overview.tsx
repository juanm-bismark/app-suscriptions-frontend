"use client"

import { getDashboardSubscriptionOverview } from "@/app/actions/dashboard"
import { loadSubscriptions } from "@/app/actions/subscriptions"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, Database, Loader2, RadioTower, RefreshCcw, ServerCog } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import type { Provider } from "@/lib/types/api"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]
const STALE_TIME_MS = 5 * 60 * 1000

const PROVIDER_LABELS: Record<Provider, string> = {
  kite: "Kite",
  tele2: "Tele2",
  moabits: "Moabits",
}

const PROVIDER_CARD_CLASSES: Record<Provider, string> = {
  kite: "bg-[#E5F5F6]",
  tele2: "bg-[#F0EAFB]",
  moabits: "bg-[#FCEADC]",
}

export function DashboardOverview() {
  const queryClient = useQueryClient()
  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardSubscriptionOverview,
  })

  useEffect(() => {
    if (!overview || isError) return

    for (const provider of PROVIDERS) {
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

  const totalLabel = overview?.globalTotal !== null && overview?.globalTotal !== undefined
    ? String(overview.globalTotal)
    : overview?.needsImport
      ? "Pendiente"
      : overview
        ? String(overview.providerTotalHint)
        : "--"

  const totalHelp = overview?.globalTotal !== null && overview?.globalTotal !== undefined
    ? "Listado global del backend"
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
            <Metric
              icon={<Database className="h-4 w-4" />}
              label="Suscripciones"
              value={totalLabel}
              help={totalHelp}
              loading={isLoading}
            />
            <Metric
              icon={<RadioTower className="h-4 w-4" />}
              label="Proveedor principal"
              value={topProvider ? PROVIDER_LABELS[topProvider.provider] : overview ? "-" : "--"}
              help={topProvider ? `${topProvider.count} en la primera consulta` : "Sin datos disponibles"}
              loading={isLoading}
            />
            <Metric
              icon={<ServerCog className="h-4 w-4" />}
              label="Consultados"
              value={overview ? `${overview.providerHints.filter((item) => item.count !== null).length}/${PROVIDERS.length}` : "--"}
              help="Kite, Tele2 y Moabits"
              loading={isLoading}
            />
          </div>
        </div>

        <div className="rounded-lg bg-[#DDF1F2] p-4 text-[#12343B] shadow-sm shadow-header-top/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#326472]">Acceso rápido</p>
              <h2 className="mt-2 text-xl font-semibold">
                {overview?.needsImport ? "Activa el listado global" : "Gestiona tus suscripciones"}
              </h2>
            </div>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#326472]" />}
          </div>
          <p className="mt-2 text-sm text-[#326472]">
            {overview?.needsImport
              ? "Carga el mapa ICCID-proveedor inicial o entra por proveedor mientras preparas la importacion."
              : "Revisa el inventario sincronizado desde tus proveedores."}
          </p>
          {isError && (
            <p className="mt-2 rounded-md bg-[#FFF7E7] px-3 py-2 text-sm font-medium text-[#6D4D16] shadow-sm shadow-warn-bg/5">
              No se pudo cargar el overview
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/subscriptions"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F202A] px-4 text-sm font-semibold text-white shadow-sm shadow-header-top/20 transition-colors hover:bg-[#163C41] hover:text-white"
            >
              Ver suscripciones
              <ArrowRight className="h-4 w-4" />
            </Link>
            {overview?.needsImport && (
              <Link
                href="/dashboard/sims/import"
                className="inline-flex h-10 items-center justify-center rounded-md bg-white/75 px-4 text-sm font-semibold text-[#12343B] shadow-sm shadow-header-top/5 transition-colors hover:bg-white"
              >
                Importar SIMs
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(overview?.providerHints ?? PROVIDERS.map((provider) => ({ provider, count: null, partial: false }))).map((item) => (
          <div key={item.provider} className={`rounded-lg px-4 py-2.5 shadow-sm shadow-header-top/5 ${PROVIDER_CARD_CLASSES[item.provider]}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-title">{PROVIDER_LABELS[item.provider]}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.count === null ? "Sin respuesta" : `${item.count} registros`}
                </p>
              </div>
              <span className={getProviderStatusClassName(item)}>
                {item.partial ? "Parcial" : item.count === null ? "Pendiente" : "OK"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function getProviderStatusClassName(item: { count: number | null; partial: boolean }) {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold"

  if (item.count === null) {
    return `${base} bg-[#F1F5F9] text-[#475569]`
  }

  if (item.partial) {
    return `${base} bg-[#FFF7E7] text-[#765315]`
  }

  return `${base} bg-[#DDF4EA] text-[#16603B]`
}

function Metric({
  icon,
  label,
  value,
  help,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: string
  help: string
  loading: boolean
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-lg bg-gradient-to-b from-[#FFFFFF] to-[#EAF6F7] px-4 py-4 shadow-sm shadow-header-top/5 lg:h-full">
      <div className="flex items-center gap-2 text-[#285F68]">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#DDF1F2] text-[#1A6E78] shadow-sm shadow-header-top/5">
          {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {loading ? (
        <>
          <div className="my-3 h-9 w-20 animate-pulse rounded bg-zebra" />
          <div className="h-3 w-28 animate-pulse rounded bg-zebra" />
        </>
      ) : (
        <>
          <div className="py-3 text-3xl font-bold text-title">{value}</div>
          <p className="text-xs text-muted">{help}</p>
        </>
      )}
    </div>
  )
}
