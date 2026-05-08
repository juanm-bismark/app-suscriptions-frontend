import { auth } from "@/auth"
import { requireProfile } from "@/lib/auth/current-user"
import ProfileForm from "./profile-form"

export default async function ProfilePage() {
  const session = await auth()
  const profile = await requireProfile()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-title mb-2">Mi Perfil</h1>
        <p className="text-muted">Actualiza tu información personal</p>
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
