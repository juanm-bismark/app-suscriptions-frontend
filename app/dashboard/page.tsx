import { auth } from "@/auth"
import { getCompany, requireProfile } from "@/lib/auth/current-user"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import { listSims } from "@/lib/api/sims"
import type { Provider, SimListOut } from "@/lib/types/api"
import Link from "next/link"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

const PROVIDER_LABELS: Record<Provider, string> = {
  kite: "Kite",
  tele2: "Tele2",
  moabits: "Moabits",
}

function isRoutingMapEmpty(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 412 &&
    error.code === "subscription.listing_precondition_failed" &&
    error.extra?.reason === "routing_map_empty"
  )
}

async function getSubscriptionOverview() {
  const [globalResult, providerResults] = await Promise.all([
    listSims({ limit: 1 })
      .then((result) => ({ ok: true as const, result }))
      .catch((error: unknown) => ({ ok: false as const, error })),
    Promise.all(
      PROVIDERS.map(async (provider) => {
        const params = provider === "tele2"
          ? { provider, limit: 1, modified_since: tele2DefaultModifiedSince() }
          : { provider, limit: 1 }

        return listSims(params)
          .then((result) => ({ provider, result }))
          .catch(() => ({ provider, result: null }))
      })
    ),
  ])

  const globalTotal = globalResult.ok ? globalResult.result.total : null
  const needsImport = !globalResult.ok && isRoutingMapEmpty(globalResult.error)

  const providerHints = providerResults.map(({ provider, result }) => ({
    provider,
    count: result ? totalOrFirstPageHint(result) : null,
    partial: result?.partial ?? false,
  }))

  return {
    globalTotal,
    needsImport,
    providerHints,
    providerTotalHint: providerHints.reduce((sum, item) => sum + (item.count ?? 0), 0),
  }
}

function totalOrFirstPageHint(result: SimListOut) {
  return result.total ?? result.items.length
}

function tele2DefaultModifiedSince() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().replace(/\.\d{3}Z$/, "Z")
}

export default async function DashboardPage() {
  const session = await auth()
  const profile = await requireProfile()
  const company = await getCompany()
  const overview = await getSubscriptionOverview()
  const topProvider = overview.providerHints
    .filter((item): item is typeof item & { count: number } => item.count !== null)
    .sort((a, b) => b.count - a.count)[0]
  const totalLabel = overview.globalTotal !== null
    ? String(overview.globalTotal)
    : overview.needsImport
      ? "Pendiente"
      : String(overview.providerTotalHint)
  const totalHelp = overview.globalTotal !== null
    ? "Listado global del backend"
    : overview.needsImport
      ? "Importa SIMs para activar el global"
      : "Estimado desde proveedores"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-title mb-2">
          Bienvenido, {profile.full_name || "Usuario"}
        </h1>
        <p className="text-muted">
          {company?.name ? `Empresa: ${company.name}` : "Aquí podrás gestionar todas tus suscripciones"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="text-xs sm:text-sm font-medium text-muted mb-2">Suscripciones</div>
          <div className="text-2xl sm:text-3xl font-bold text-title">{totalLabel}</div>
          <p className="text-xs text-muted mt-2">{totalHelp}</p>
        </div>
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="text-xs sm:text-sm font-medium text-muted mb-2">Proveedor principal</div>
          <div className="text-2xl sm:text-3xl font-bold text-title">
            {topProvider ? PROVIDER_LABELS[topProvider.provider] : "-"}
          </div>
          <p className="text-xs text-muted mt-2">
            {topProvider ? `${topProvider.count} en la primera consulta` : "Sin datos disponibles"}
          </p>
        </div>
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border sm:col-span-2 lg:col-span-1">
          <div className="text-xs sm:text-sm font-medium text-muted mb-2">Proveedores consultados</div>
          <div className="text-2xl sm:text-3xl font-bold text-title">
            {overview.providerHints.filter((item) => item.count !== null).length}/{PROVIDERS.length}
          </div>
          <p className="text-xs text-muted mt-2">Kite, Tele2 y Moabits</p>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-8 sm:p-12 text-center border border-border">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-badge-bg rounded-lg mb-4">
            <svg className="w-6 h-6 text-header-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-title mb-2">
          {overview.needsImport ? "Importa SIMs para activar el listado global" : "Gestiona tus suscripciones"}
        </h3>
        <p className="text-muted mb-6 text-sm sm:text-base">
          {overview.needsImport
            ? "Carga el mapa ICCID-proveedor inicial o entra por proveedor mientras preparas la importacion."
            : "Revisa el inventario sincronizado desde tus proveedores."}
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="px-6" asChild>
            <Link href="/dashboard/subscriptions">Ver suscripciones</Link>
          </Button>
          {overview.needsImport && (
            <Button className="px-6" variant="outline" asChild>
              <Link href="/dashboard/sims/import">Importar SIMs</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-title mb-6">Información de tu cuenta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Correo</label>
            <p className="text-title font-mono text-sm sm:text-base break-all">{session?.user?.email || "N/A"}</p>
          </div>

          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Nombre</label>
            <p className="text-title text-sm sm:text-base">{profile.full_name || "N/A"}</p>
          </div>

          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Rol</label>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-header-accent/10 text-header-accent uppercase">
              {profile.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
