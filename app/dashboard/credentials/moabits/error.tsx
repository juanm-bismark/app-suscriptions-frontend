"use client"

import Link from "next/link"
import { ProblemAlert } from "@/app/dashboard/_components/problem-alert"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MoabitsCredentialsError({ error, reset }: ErrorProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link className="text-sm font-medium text-header-bg hover:underline mb-4 inline-block" href="/dashboard/credentials">
        ← Volver a credenciales
      </Link>
      <div className="rounded-lg bg-red-50 border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-4">
          Error al cargar Moabits
        </h2>
        <ProblemAlert
          problem={error}
          title="No se pudo cargar la configuración de Moabits"
          fallbackDetail="Ocurrio un error al cargar. Por favor, intenta de nuevo."
          onRetry={reset}
        />
      </div>
    </div>
  )
}
