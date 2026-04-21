import { auth } from "@/auth"
import { SignOutButton } from "@/app/components/sign-out-button"
import Image from "next/image"
import Link from "next/link"
import { fetchApi } from "@/lib/api-client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  let profile = null
  try {
    if (session?.user) {
      profile = await fetchApi<any>("/me")
    }
  } catch (error) {
    // If not authenticated, dashboard pages will redirect anyway
  }

  return (
    <div className="min-h-screen flex flex-col bg-page">
      {/* Navigation */}
      <nav className="bg-header-bg border-b border-header-info-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                <Image
                  src="https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 flex-shrink-0"
                />
                <span className="text-header-text font-semibold hidden sm:block truncate">App Suscripciones</span>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-4 text-sm text-header-text">
                <Link href="/dashboard" className="opacity-70 hover:opacity-100 transition-opacity">Overview</Link>
                <Link href="/dashboard/profile" className="opacity-70 hover:opacity-100 transition-opacity">Mi Perfil</Link>

                {(profile?.role === "admin" || profile?.role === "manager") && (
                  <Link href="/dashboard/users" className="opacity-70 hover:opacity-100 transition-opacity">Usuarios</Link>
                )}
                {profile?.role === "admin" && (
                  <Link href="/dashboard/company" className="opacity-70 hover:opacity-100 transition-opacity">Empresa</Link>
                )}
              </div>
            </div>
            {session?.user && <SignOutButton />}
          </div>

          {/* Mobile Menu Overflow (Horizontal Scroll) */}
          <div className="md:hidden flex overflow-x-auto gap-4 py-2 text-sm text-header-text pb-3 px-1 no-scrollbar">
            <Link href="/dashboard" className="whitespace-nowrap opacity-70">Overview</Link>
            <Link href="/dashboard/profile" className="whitespace-nowrap opacity-70">Mi Perfil</Link>
            {(profile?.role === "admin" || profile?.role === "manager") && (
              <Link href="/dashboard/users" className="whitespace-nowrap opacity-70">Usuarios</Link>
            )}
            {profile?.role === "admin" && (
              <Link href="/dashboard/company" className="whitespace-nowrap opacity-70">Empresa</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
