"use client"

import { ProblemAlert } from "@/app/dashboard/_components/problem-alert"

export default function CredentialsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProblemAlert
        problem={error}
        title="Error al cargar credenciales"
        fallbackDetail="Ocurrio un problema al cargar la configuracion de proveedores."
        onRetry={reset}
      />
    </div>
  )
}
