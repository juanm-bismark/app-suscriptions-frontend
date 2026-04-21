"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Header() {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith("/dashboard")

  if (!isDashboard) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 bg-header-bg border-b border-header-info-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8">
              <Image
                src="https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="hidden sm:block font-semibold text-header-text group-hover:text-header-accent transition-colors">
              App Suscripciones
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-header-text hover:text-header-accent transition-colors"
            >
              Mis Suscripciones
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-header-text hover:text-header-accent transition-colors"
            >
              Configuración
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
