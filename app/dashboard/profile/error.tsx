"use client"

import { ProblemAlert } from "@/app/dashboard/_components/problem-alert"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProfileError({ error, reset }: ErrorProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProblemAlert
        problem={error}
        title="Error al cargar tu perfil"
        fallbackDetail="Ocurrio un problema al cargar tu informacion. Por favor, intenta de nuevo."
        onRetry={reset}
      >
        {process.env.NODE_ENV === "development" && (
          <details className="text-xs text-red-600 mb-4 bg-white p-2 rounded">
            <summary className="cursor-pointer font-mono">Detalles del error</summary>
            <pre className="mt-2 overflow-auto text-red-600">{error.message}</pre>
          </details>
        )}
      </ProblemAlert>
    </div>
  )
}
