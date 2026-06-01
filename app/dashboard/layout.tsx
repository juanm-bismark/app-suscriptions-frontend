import Link from "next/link"
import { UserRound } from "lucide-react"
import { SignOutButton } from "@/app/components/sign-out-button"
import { getProfile } from "@/lib/auth/current-user"
import { canAccessDashboard, canManageCompanies, canManageUsers, type UserRole } from "@/lib/types/user"
import { Logo } from "@/app/components/logo"
import { Button } from "@/components/ui/button"
import { DashboardNavLink } from "./_components/dashboard-nav-link"
import { dashboardStyles } from "./_components/dashboard-styles"

interface NavItem {
  href: string
  label: string
  visible: (role?: UserRole) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", visible: canAccessDashboard },
  { href: "/dashboard/subscriptions", label: "Suscripciones", visible: canAccessDashboard },
  { href: "/dashboard/users", label: "Usuarios", visible: canManageUsers },
  { href: "/dashboard/credentials", label: "Credenciales", visible: canManageUsers },
  { href: "/dashboard/company", label: "Empresas", visible: canManageCompanies },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  const items = NAV_ITEMS.filter((item) => item.visible(profile?.role))
  const homeHref = canAccessDashboard(profile?.role) ? "/dashboard" : "/dashboard/profile"

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <nav
        className="sticky top-0 z-[60] bg-nav-soft/55 shadow-sm shadow-nav-shadow/5 ring-1 ring-white/25 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-5 min-w-0">
              <Link href={homeHref} className="flex items-center gap-2 min-w-0">
                <Logo size="md" priority />
              </Link>

              <div className="hidden md:flex self-stretch items-center gap-3 text-sm text-title">
                {items.map((item) => (
                  <DashboardNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                  />
                ))}
              </div>
            </div>
            {profile && (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  asChild
                  variant="secondary"
                  className="h-9 gap-2 border border-white/20 bg-white/70 px-3 font-semibold text-nav-button-text shadow-sm shadow-header-top/5 hover:bg-nav-button-soft hover:text-nav-button-hover"
                >
                  <Link href="/dashboard/profile" aria-label="Mi Perfil">
                    <span className={dashboardStyles.navProfileIcon}>
                      <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="hidden sm:inline">Mi Perfil</span>
                  </Link>
                </Button>
                <SignOutButton />
              </div>
            )}
          </div>

          <div className="md:hidden flex overflow-x-auto gap-3 py-1 pb-2 px-1 text-sm text-title no-scrollbar">
            {items.map((item) => (
              <DashboardNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                variant="mobile"
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-1">{children}</div>
    </div>
  )
}
