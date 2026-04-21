import { auth } from "@/auth"
import { SignOutButton } from "@/app/components/sign-out-button"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { fetchApi } from "@/lib/api-client"

// Componente para actualizar el perfil desde el cliente
import ProfileForm from "./profile-form"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch user profile
  let profile = null
  try {
    profile = await fetchApi<any>("/me")
  } catch (error) {
    console.error("Error fetching profile:", error)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-title mb-2">Mi Perfil</h1>
        <p className="text-muted">Actualiza tu información personal</p>
      </div>

      <div className="bg-card rounded-lg shadow border border-border p-6 sm:p-8">
        <ProfileForm
          initialName={profile?.full_name || session.user.name || ""}
          email={profile?.email || session.user.email || ""}
          role={profile?.role || "Usuario"}
        />
      </div>
    </div>
  )
}
