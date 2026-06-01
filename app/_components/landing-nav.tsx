import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/app/components/logo"

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-[#E7F4F2]/55 shadow-sm shadow-[#6A9AA0]/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button className="h-10 bg-[#247F89] text-white shadow-sm shadow-[#4F8C92]/20 hover:bg-[#1D6D76] hover:text-white">
                Inicia sesion
              </Button>
            </Link>
            <Link href="/register">
              <Button className="h-10 border-0 bg-white/70 text-[#226F78] shadow-sm shadow-[#6A9AA0]/10 hover:bg-[#F6FCFC] hover:text-[#184F56]">
                Registrate
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
