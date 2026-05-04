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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-header-accent rounded-full mix-blend-multiply filter blur-3xl opacity-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-header-client rounded-full mix-blend-multiply filter blur-3xl opacity-blob"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="md" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-header-text mb-4 tracking-tight">
            Gestiona tus <br className="hidden sm:block" />
            <span className="text-header-accent">suscripciones</span>
          </h1>

          <p className="text-lg sm:text-xl text-header-sub mb-8 max-w-2xl mx-auto px-4">
            Controla costos, fechas de renovación y nunca olvides una suscripción importante
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 mb-16">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-header-accent hover:bg-header-accent/hover-emphasis text-white">
                Comenzar Ahora
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full border-header-accent text-header-accent hover:bg-header-accent/badge">
                Inicia sesión
              </Button>
            </Link>
          </div>

          <div className="bg-header-info-bg/soft-bg backdrop-blur border border-header-info-border rounded-lg p-6 sm:p-8 max-w-2xl mx-auto">
            <h3 className="text-header-text font-semibold mb-6 text-lg">Por qué App Suscripciones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <span className="text-header-client text-xl flex-shrink-0">{feature.icon}</span>
                  <div>
                    <p className="text-header-text font-medium text-sm">{feature.title}</p>
                    <p className="text-header-sub text-xs mt-1">{feature.description}</p>
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
