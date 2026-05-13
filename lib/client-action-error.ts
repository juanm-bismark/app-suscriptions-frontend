export function getClientActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message.trim()

    if (
      message === "Load failed" ||
      message === "Failed to fetch" ||
      message === "NetworkError when attempting to fetch resource."
    ) {
      return "No se pudo comunicar con el servidor. Revisa la conexion e intenta de nuevo."
    }

    if (message) return message
  }

  if (typeof error === "string" && error.trim()) return error

  return fallback
}
