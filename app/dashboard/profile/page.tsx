import { getCompany, requireProfile } from "@/lib/auth/current-user"
import { Building2 } from "lucide-react"
import ProfileForm from "./profile-form"

export default async function ProfilePage() {
  const profile = await requireProfile()
  const company = await getCompany()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-title mb-2">Mi Perfil</h1>
            <p className="text-muted">Actualiza tu información personal</p>
          </div>
          <div className="flex max-w-full items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:max-w-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Empresa</p>
              <p className="truncate text-sm font-semibold text-title">{company?.name || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
        <ProfileForm
          initialName={profile.full_name || ""}
          email={profile.email || ""}
          role={profile.role}
        />
      </div>
    </div>
  )
}
