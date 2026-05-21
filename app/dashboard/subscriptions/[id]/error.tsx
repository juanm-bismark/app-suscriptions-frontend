"use client"

import { ProblemAlert } from "@/app/dashboard/_components/problem-alert"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SubscriptionDetailError({ error, reset }: ErrorProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="rounded-lg bg-red-50 border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-4">
          Error al cargar el detalle de la suscripción
        </h2>
        <ProblemAlert
          problem={error}
          title="No se pudo cargar la suscripción"
          fallbackDetail="Ocurrio un error al cargar los detalles. Por favor, intenta de nuevo."
          onRetry={reset}
        />
      </div>
    </div>
  )
}
