"use client"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function UsersError({ error, reset }: ErrorProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">
          Error al cargar los usuarios
        </h2>
        <p className="text-red-700 mb-4">
          Ocurri   un problema al cargar la lista de usuarios. Por favor, intenta de nuevo.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="text-xs text-red-600 mb-4 bg-white p-2 rounded border border-red-100">
            <summary className="cursor-pointer font-mono">Detalles del error</summary>
            <pre className="mt-2 overflow-auto text-red-600">{error.message}</pre>
          </details>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
