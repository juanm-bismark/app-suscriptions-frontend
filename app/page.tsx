import { auth } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-header-top via-header-bg to-header-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-header-bg/95 backdrop-blur border-b border-header-info-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-header-text font-semibold hidden sm:block">App Suscripciones</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-header-text hover:text-header-accent hover:bg-transparent">
                  Inicia sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-header-accent hover:bg-header-accent/90 text-white">
                  Registrate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-header-accent rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-header-client rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"
                alt="Logo"
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-header-text mb-4 tracking-tight">
              Gestiona tus <br className="hidden sm:block" />
              <span className="text-header-accent">suscripciones</span>
            </h1>

            <p className="text-lg sm:text-xl text-header-sub mb-8 max-w-2xl mx-auto px-4">
              Controla costos, fechas de renovación y nunca olvides una suscripción importante
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 mb-16">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-header-accent hover:bg-header-accent/90 text-white">
                  Comenzar Ahora
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-header-accent text-header-accent hover:bg-header-accent/10">
                  Inicia sesión
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="bg-header-info-bg/50 backdrop-blur border border-header-info-border rounded-lg p-6 sm:p-8 max-w-2xl mx-auto">
              <h3 className="text-header-text font-semibold mb-6 text-lg">¿Por qué App Suscripciones?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex gap-3">
                  <span className="text-header-client text-xl flex-shrink-0">✓</span>
                  <div>
                    <p className="text-header-text font-medium text-sm">Seguimiento completo</p>
                    <p className="text-header-sub text-xs mt-1">De todas tus suscripciones en un solo lugar</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-header-client text-xl flex-shrink-0">✓</span>
                  <div>
                    <p className="text-header-text font-medium text-sm">Recordatorios</p>
                    <p className="text-header-sub text-xs mt-1">De renovaciones antes de que lleguen</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-header-client text-xl flex-shrink-0">✓</span>
                  <div>
                    <p className="text-header-text font-medium text-sm">Análisis de gastos</p>
                    <p className="text-header-sub text-xs mt-1">Visualiza cuánto gastas mensualmente</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-header-client text-xl flex-shrink-0">✓</span>
                  <div>
                    <p className="text-header-text font-medium text-sm">Sincronización</p>
                    <p className="text-header-sub text-xs mt-1">Accede desde cualquier dispositivo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-footer-bg border-t border-footer-divider mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <Image
                src="https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"
                alt="Logo"
                width={96}
                height={96}
                className="w-24 h-24 mb-4"
              />
              <p className="text-footer-text text-sm">Gestiona tus suscripciones con confianza</p>
            </div>
            <div>
              <h4 className="text-footer-text font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-footer-text">
                <li><Link href="#" className="hover:text-footer-addr-text">Características</Link></li>
                <li><Link href="#" className="hover:text-footer-addr-text">Precios</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-footer-text font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-footer-text">
                <li><Link href="#" className="hover:text-footer-addr-text">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-footer-addr-text">Términos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-footer-divider pt-8 text-center text-sm text-footer-text">
            <p>&copy; 2024 App Suscripciones. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
