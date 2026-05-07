"use client"

import { ProblemAlert } from "@/app/dashboard/_components/problem-alert"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function UsersError({ error, reset }: ErrorProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProblemAlert
        problem={error}
        title="Error al cargar los usuarios"
        fallbackDetail="Ocurrio un problema al cargar la lista de usuarios. Por favor, intenta de nuevo."
        onRetry={reset}
      >
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
