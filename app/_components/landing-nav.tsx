import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/app/components/logo"

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-header-bg/translucent-nav backdrop-blur border-b border-header-info-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-header-text hover:text-header-accent hover:bg-transparent">
                Inicia sesinnn
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-header-accent hover:bg-header-accent/hover-emphasis text-white">
                Registrate
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
