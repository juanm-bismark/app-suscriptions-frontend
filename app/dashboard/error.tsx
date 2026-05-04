"use client"

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
            Algo sali   mal
          </h2>
          <p className="text-muted mb-8">
            Ocurri   un error al cargar el panel. Por favor, intenta de nuevo.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="mb-8 text-left bg-zebra border border-divider rounded-lg p-4 overflow-auto max-h-32">
              <p className="text-xs font-mono text-muted whitespace-pre-wrap break-words">
                {error.message}
              </p>
            </div>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center px-6 py-3 bg-header-accent text-white rounded-lg hover:bg-opacity-hover-emphasis transition-colors font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.581 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  )
}
