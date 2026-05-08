import { Logo } from "@/app/components/logo"

interface LandingFooterProps {
  year?: number
}

export function LandingFooter({ year = new Date().getFullYear() }: LandingFooterProps) {
  return (
    <footer className="mt-16 bg-[#EAF3F2] text-[#12343B] shadow-[0_-3px_12px_rgba(10,30,42,0.025)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="sm" />
          <p className="text-sm text-[#536B70]">Gestiona tus suscripciones con confianza</p>
        </div>
        <div className="mt-5 text-center text-sm text-[#6C7F83]">
          <p>&copy; {year} App Suscripciones. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
