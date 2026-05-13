import { auth } from "@/auth"
import { getCompany, requireProfile } from "@/lib/auth/current-user"
import { canAccessDashboard } from "@/lib/types/user"
import { Building2 } from "lucide-react"
import { DashboardOverview } from "./dashboard-overview"
import ProfileForm from "./profile/profile-form"

export default async function DashboardPage() {
  const session = await auth()
  const profile = await requireProfile()

  if (!canAccessDashboard(profile.role)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-title mb-2">Mi Perfil</h1>
          <p className="text-muted">
            Tu rol actual no tiene acceso al dashboard. Puedes revisar y actualizar tu informacion personal.
          </p>
        </div>

        <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
          <ProfileForm
            initialName={profile.full_name || ""}
            email={session?.user?.email || ""}
            role={profile.role}
          />
        </div>
      </div>
    )
  }

  const company = await getCompany()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:mb-8 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 md:pr-6">
            <h1 className="text-3xl font-bold text-title mb-2 sm:text-4xl">
              Bienvenido, {profile.full_name || "Usuario"}
            </h1>
            <p className="text-muted">Aquí podrás gestionar todas tus suscripciones</p>
          </div>
          <div className="flex w-full max-w-full shrink-0 items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 md:w-72 xl:w-80">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">Empresa</p>
              <p className="truncate text-sm font-semibold text-title">{company?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <DashboardOverview />

      <div className="mt-10 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-title sm:text-xl">Información de tu cuenta</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white/75 p-4 shadow-sm shadow-header-top/5 sm:p-6">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Correo</label>
            <p className="text-title font-mono text-sm sm:text-base break-all">{session?.user?.email || "N/A"}</p>
          </div>

          <div className="rounded-lg bg-white/75 p-4 shadow-sm shadow-header-top/5 sm:p-6">
            <label className="block text-xs sm:text-sm font-medium text-muted mb-2">Nombre</label>
            <p className="text-title text-sm sm:text-base">{profile.full_name || "N/A"}</p>
          </div>

          <div className="rounded-lg bg-white/75 p-4 shadow-sm shadow-header-top/5 sm:p-6">
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
