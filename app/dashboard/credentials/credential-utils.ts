import type { Provider } from "@/lib/types/api"
import { SOURCES, STATUS_TONES } from "@/app/dashboard/subscriptions/tokens"

export const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

export function isProvider(value: string): value is Provider {
  return PROVIDERS.includes(value as Provider)
}

export function providerName(provider: Provider) {
  return SOURCES[provider].name
}

export const EXPIRY_META = {
  valid: { label: "Valida", meta: STATUS_TONES.success },
  expiring: { label: "Por vencer", meta: STATUS_TONES.warn },
  expired: { label: "Vencida", meta: STATUS_TONES.danger },
  invalid: { label: "Invalida", meta: STATUS_TONES.neutral },
} as const

export function formatDate(value: string | null | undefined) {
  if (!value) return "Sin registro"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function scopeValue(scope: Record<string, unknown>, key: string) {
  const value = scope[key]
  if (value == null || value === "") return "No definido"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
