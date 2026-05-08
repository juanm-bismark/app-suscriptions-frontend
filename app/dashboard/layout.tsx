import Link from "next/link"
import { UserRound } from "lucide-react"
import { SignOutButton } from "@/app/components/sign-out-button"
import { getProfile } from "@/lib/auth/current-user"
import { canManageUsers, canViewCompany, type UserRole } from "@/lib/types/user"
import { Logo } from "@/app/components/logo"
import { Button } from "@/components/ui/button"
import { DashboardNavLink } from "./_components/dashboard-nav-link"

interface NavItem {
  href: string
  label: string
  visible: (role?: UserRole) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", visible: () => true },
  { href: "/dashboard/subscriptions", label: "Suscripciones", visible: () => true },
  { href: "/dashboard/users", label: "Usuarios", visible: canManageUsers },
  { href: "/dashboard/credentials", label: "Credenciales", visible: canManageUsers },
  { href: "/dashboard/company", label: "Empresa", visible: canViewCompany },
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
      <nav
        className="sticky top-0 z-[60] bg-card/95 shadow-sm shadow-header-top/5 ring-1 ring-black/[0.025] backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-5 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
                <Logo size="md" />
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
                  className="h-9 gap-2 border border-header-bg/35 bg-[#E1F3F4] px-3 font-semibold text-[#0F2F35] shadow-sm shadow-header-top/5 hover:bg-[#C8E8EA] hover:text-[#0F2F35]"
                >
                  <Link href="/dashboard/profile" aria-label="Mi Perfil">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#12343B] text-white">
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
