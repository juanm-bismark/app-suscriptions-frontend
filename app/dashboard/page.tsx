import { auth } from "@/auth"
import { getCompany, requireProfile } from "@/lib/auth/current-user"
import { DashboardOverview } from "./dashboard-overview"

export default async function DashboardPage() {
  const session = await auth()
  const profile = await requireProfile()
  const company = await getCompany()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-title mb-2">
          Bienvenido, {profile.full_name || "Usuario"}
        </h1>
        <p className="text-muted">
          {company?.name ? `Empresa: ${company.name}` : "Aquí podrás gestionar todas tus suscripciones"}
        </p>
      </div>

      <DashboardOverview />

      <div className="mt-12 pt-8">
        <h2 className="mb-6 text-lg font-semibold text-title sm:text-xl">Información de tu cuenta</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-[#F5FAFA] p-4 shadow-sm shadow-header-top/5 sm:p-6">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Correo</label>
            <p className="text-title font-mono text-sm sm:text-base break-all">{session?.user?.email || "N/A"}</p>
          </div>

          <div className="rounded-lg bg-[#F5FAFA] p-4 shadow-sm shadow-header-top/5 sm:p-6">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Nombre</label>
            <p className="text-title text-sm sm:text-base">{profile.full_name || "N/A"}</p>
          </div>

          <div className="rounded-lg bg-[#F5FAFA] p-4 shadow-sm shadow-header-top/5 sm:p-6">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Rol</label>
            <div className="inline-flex items-center rounded-full bg-[#DDF1F2] px-2.5 py-0.5 text-xs font-semibold uppercase text-[#12343B]">
              {profile.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
