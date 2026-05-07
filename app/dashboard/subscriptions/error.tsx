"use client"

import { ProblemAlert } from "@/app/dashboard/_components/problem-alert"
import Link from "next/link"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SubscriptionsError({ error, reset }: ErrorProps) {
  const needsProviderSync =
    error.message.includes("listing_precondition_failed") || error.message.includes("routing_map_empty")

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProblemAlert
        problem={error}
        title="Error al cargar las suscripciones"
        fallbackDetail="Ocurrio un problema al cargar tu lista de suscripciones. Por favor, intenta de nuevo."
        onRetry={reset}
      >
        {needsProviderSync && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href="/dashboard/sims/import"
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Importar SIMs
            </Link>
            <Link
              href="/dashboard/subscriptions?provider=kite"
              className="px-3 py-2 bg-white border border-red-200 text-red-800 rounded hover:bg-red-100 transition"
            >
              Ver por proveedor
            </Link>
            <Link
              href="/dashboard/subscriptions?provider=tele2"
              className="px-3 py-2 bg-white border border-red-200 text-red-800 rounded hover:bg-red-100 transition"
            >
              Ver Tele2
            </Link>
            <Link
              href="/dashboard/subscriptions?provider=moabits"
              className="px-3 py-2 bg-white border border-red-200 text-red-800 rounded hover:bg-red-100 transition"
            >
              Ver Moabits
            </Link>
          </div>
        )}
        {process.env.NODE_ENV === "development" && (
          <details className="text-xs text-red-600 mb-4 bg-white p-2 rounded border border-red-100">
            <summary className="cursor-pointer font-mono">Detalles del error</summary>
            <pre className="mt-2 overflow-auto text-red-600">{error.message}</pre>
          </details>
        )}
      </ProblemAlert>
    </div>
  )
}
