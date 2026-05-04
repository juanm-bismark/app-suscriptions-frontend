import Link from "next/link"
import { SignOutButton } from "@/app/components/sign-out-button"
import { getProfile } from "@/lib/auth/current-user"
import { canManageUsers, isAdmin, type UserRole } from "@/lib/types/user"
import { Logo } from "@/app/components/logo"

interface NavItem {
  href: string
  label: string
  visible: (role?: UserRole) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", visible: () => true },
  { href: "/dashboard/subscriptions", label: "Suscripciones", visible: () => true },
  { href: "/dashboard/profile", label: "Mi Perfil", visible: () => true },
  { href: "/dashboard/users", label: "Usuarios", visible: canManageUsers },
  { href: "/dashboard/company", label: "Empresa", visible: isAdmin },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  const items = NAV_ITEMS.filter((item) => item.visible(profile?.role))

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <nav className="sticky top-0 z-50 border-b border-divider bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                <Logo size="md" />
              </Link>

              <div className="hidden md:flex items-center gap-4 text-sm text-title">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-muted hover:text-title transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            {profile && <SignOutButton />}
          </div>

          <div className="md:hidden flex overflow-x-auto gap-4 py-2 pb-3 px-1 text-sm text-title no-scrollbar">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-1">{children}</div>
    </div>
  )
}
