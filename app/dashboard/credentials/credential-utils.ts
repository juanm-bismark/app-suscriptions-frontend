import type { Provider } from "@/lib/types/api"
import { PROVIDER_IDS, providerDisplayName } from "@/lib/provider-meta"
import { formatDateTime } from "@/lib/formatters"
import { STATUS_TONES } from "@/lib/status-tones"

export { isProvider } from "@/lib/provider-meta"
export const PROVIDERS: Provider[] = PROVIDER_IDS

export function providerName(provider: Provider) {
  return providerDisplayName(provider)
}

export const EXPIRY_META = {
  valid: { label: "Valida", meta: STATUS_TONES.success },
  expiring: { label: "Por vencer", meta: STATUS_TONES.warn },
  expired: { label: "Vencida", meta: STATUS_TONES.danger },
  invalid: { label: "Invalida", meta: STATUS_TONES.neutral },
} as const

export function formatDate(value: string | null | undefined) {
  return formatDateTime(value, {
    fallback: "Sin registro",
    invalidFallback: value ?? "Sin registro",
  })
}

export function scopeValue(scope: Record<string, unknown>, key: string) {
  const value = scope[key]
  if (value == null || value === "") return "No definido"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
