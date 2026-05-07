"use client"

import { ProblemAlert } from "@/app/dashboard/_components/problem-alert"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div className="flex-1 flex flex-col bg-page">
      <div className="bg-card border-b border-divider px-8 py-6">
        <h1 className="text-3xl font-bold text-header-text">Error</h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-lg">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-title mb-2">
            Algo salio mal
          </h2>
          <p className="text-muted mb-8">
            Ocurrio un error al cargar el panel. Por favor, intenta de nuevo.
          </p>
          <ProblemAlert
            problem={error}
            title="Error al cargar el panel"
            fallbackDetail="Ocurrio un problema al cargar el panel."
            onRetry={reset}
          />
        </div>
      </div>
    </div>
  )
}
