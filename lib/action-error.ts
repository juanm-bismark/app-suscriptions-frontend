import type { z } from "zod"

export function firstZodIssue(error: z.ZodError, fallback = "Datos invalidos") {
  return error.issues[0]?.message ?? fallback
}

export function actionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const detail = "detail" in error ? error.detail : undefined
    if (typeof detail === "string" && detail.trim()) return detail

    const title = "title" in error ? error.title : undefined
    if (typeof title === "string" && title.trim()) return title
  }

  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === "string" && error.trim()) return error

  return fallback
}
