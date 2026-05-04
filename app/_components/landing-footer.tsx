import { Logo } from "@/app/components/logo"

interface LandingFooterProps {
  year?: number
}

export function LandingFooter({ year = new Date().getFullYear() }: LandingFooterProps) {
  return (
    <footer className="bg-header-bg border-t border-header-info-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-3">
          <Logo size="sm" />
          <p className="text-header-sub text-sm">Gestiona tus suscripciones con confianza</p>
        </div>
        <div className="border-t border-header-info-border mt-6 pt-6 text-center text-sm text-header-sub">
          <p>&copy; {year} App Suscripciones. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
