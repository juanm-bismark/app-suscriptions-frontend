import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn — class name utility
 *
 * Combina clsx (lógica condicional de clases) con tailwind-merge
 * (resuelve conflictos de clases Tailwind).
 *
 * Sin esto: "px-2 px-4" → ambas clases en el DOM (error silencioso).
 * Con esto:  cn("px-2", "px-4") → solo "px-4" (la última gana).
 *
 * @example
 * cn("base-class", isActive && "active-class", className)
 * cn("text-red-500", "text-blue-500") // → "text-blue-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * formatDate — formatea fechas de forma consistente
 * Centralizar esto evita inconsistencias de locale entre componentes.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }
): string {
  return new Intl.DateTimeFormat("es-CO", options).format(new Date(date))
}

/**
 * sleep — util para testing de estados de carga
 * @example await sleep(1000)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
