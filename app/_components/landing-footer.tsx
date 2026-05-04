import { Logo } from "@/app/components/logo"

interface LandingFooterProps {
  year?: number
}

export function LandingFooter({ year = new Date().getFullYear() }: LandingFooterProps) {
  return (
    <footer className="bg-header-bg border-t border-header-info-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <Logo size="lg" />
          <p className="text-header-sub text-sm mb-8 mt-4">Gestiona tus suscripciones con confianza</p>
        </div>
        <div className="border-t border-header-info-border pt-6 text-center text-sm text-header-sub">
          <p>&copy; {year} App Suscripciones. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
