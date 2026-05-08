import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/app/components/logo"

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-header-bg/translucent-nav shadow-sm shadow-black/10 ring-1 ring-white/5 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button className="h-10 bg-[#1A4A52] text-white shadow-sm shadow-black/15 hover:bg-[#235D66] hover:text-white">
                Inicia sesion
              </Button>
            </Link>
            <Link href="/register">
              <Button className="h-10 bg-white text-[#12343B] shadow-sm shadow-black/15 hover:bg-[#DFF4F2] hover:text-[#12343B]">
                Registrate
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
