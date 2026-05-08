import type { Metadata } from "next"
import { Toaster } from "@/components/ui"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "App Suscripciones",
  description: "Gestiona tus suscripciones fácilmente",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-page text-text">
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
