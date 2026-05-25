import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/app/components/logo"

interface HeroFeature {
  icon: string
  title: string
  description: string
}

const FEATURES: HeroFeature[] = [
  {
    icon: "✓",
    title: "Seguimiento completo",
    description: "De todas tus suscripciones en un solo lugar",
  },
  {
    icon: "✓",
    title: "Recordatorios",
    description: "De renovaciones antes de que lleguen",
  },
  {
    icon: "✓",
    title: "Análisis de gastos",
    description: "Visualiza cuánto gastas mensualmente",
  },
  {
    icon: "✓",
    title: "Sincronización",
    description: "Accede desde cualquier dispositivo",
  },
]

export function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center justify-center rounded-lg bg-white/75 px-5 py-3 shadow-sm shadow-[#6A9AA0]/10 ring-1 ring-white/80 backdrop-blur-sm">
              <Logo size="md" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#12343B] mb-4 tracking-tight">
            Gestiona tus <br className="hidden sm:block" />
            <span className="text-[#247F89]">suscripciones</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#4F6870] mb-8 max-w-2xl mx-auto px-4">
            Controla costos, fechas de renovación y nunca olvides una suscripción importante
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 mb-14">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full border-0 bg-[#247F89] text-white shadow-sm shadow-[#4F8C92]/20 hover:bg-[#1D6D76] hover:text-white">
                Inicia sesión
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full border border-white/75 bg-white/75 text-[#226F78] shadow-md shadow-[#6A9AA0]/10 hover:bg-[#F6FCFC] hover:text-[#184F56]">
                Comenzar Ahora
              </Button>
            </Link>
          </div>

          <div className="bg-white/45 backdrop-blur rounded-lg p-6 shadow-sm shadow-[#6A9AA0]/10 ring-1 ring-white/70 sm:p-8 max-w-2xl mx-auto">
            <h3 className="text-[#12343B] font-semibold mb-6 text-lg">Por qué App Suscripciones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <span className="text-[#247F89] text-xl flex-shrink-0">{feature.icon}</span>
                  <div>
                    <p className="text-[#12343B] font-medium text-sm">{feature.title}</p>
                    <p className="text-[#4F6870] text-xs mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
