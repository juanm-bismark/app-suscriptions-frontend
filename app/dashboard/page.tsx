import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { fetchApi } from "@/lib/api-client"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch user profile and company
  let profile = null
  let company = null

  try {
    profile = await fetchApi<any>("/me")
    company = await fetchApi<any>("/companies/me")
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Welcome Section */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-title mb-2">
          Bienvenido, {profile?.full_name || session.user.name || "Usuario"}
        </h1>
        <p className="text-muted">
          {company?.name ? `Empresa: ${company.name}` : "Aquí podrás gestionar todas tus suscripciones"}
        </p>
      </div>

      {/* Stats Grid - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="text-xs sm:text-sm font-medium text-muted mb-2">Suscripciones Activas</div>
          <div className="text-2xl sm:text-3xl font-bold text-title">0</div>
          <p className="text-xs text-muted mt-2">Próximamente</p>
        </div>
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border">
          <div className="text-xs sm:text-sm font-medium text-muted mb-2">Gasto Mensual</div>
          <div className="text-2xl sm:text-3xl font-bold text-title">$0</div>
          <p className="text-xs text-muted mt-2">Estimado</p>
        </div>
        <div className="bg-card rounded-lg shadow p-4 sm:p-6 border border-border sm:col-span-2 lg:col-span-1">
          <div className="text-xs sm:text-sm font-medium text-muted mb-2">Próxima Renovación</div>
          <div className="text-2xl sm:text-3xl font-bold text-title">-</div>
          <p className="text-xs text-muted mt-2">Próximamente</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-card rounded-lg shadow p-8 sm:p-12 text-center border border-border">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-badge-bg rounded-lg mb-4">
            <svg className="w-6 h-6 text-header-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-title mb-2">Sin suscripciones aún</h3>
        <p className="text-muted mb-6 text-sm sm:text-base">
          Comienza agregando tus suscripciones para mantenerlas bajo control
        </p>
        <Button className="bg-header-accent hover:bg-header-accent/hover-emphasis text-white px-6">
          Agregar Suscripción
        </Button>
      </div>

      {/* User Info */}
      <div className="mt-12 border-t border-border pt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-title mb-6">Información de tu cuenta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Correo</label>
            <p className="text-title font-mono text-sm sm:text-base break-all">{profile?.email || session.user.email}</p>
          </div>

          <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Nombre</label>
            <p className="text-title text-sm sm:text-base">{profile?.full_name || session.user.name || "N/A"}</p>
          </div>

          {profile?.role && (
            <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
              <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Rol</label>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-header-accent/badge text-header-accent uppercase">
                {profile.role}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
