import type { SubscriptionOut, UsageOut } from "@/lib/types/api"

const VISIBLE_SIM_IDENTIFIER_KEYS = new Set(["iccid", "msisdn", "imsi", "imei", "eid", "euiccid"])

export type TabId = "detail" | "usage" | "presence" | "limits" | "actions"
export type AsyncState<T> =
  | { status: "idle" | "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string; code?: string }

export function isTechnicalIdentifierField(key: string) {
  const raw = key.trim()
  const normalized = raw.toLowerCase()
  if (VISIBLE_SIM_IDENTIFIER_KEYS.has(normalized)) return false
  return /(^|[_-])id($|[_-])|[a-z0-9]Id$|uuid|guid|company[_-]?code|account[_-]?id|sim[_-]?profile[_-]?id/i.test(raw)
}

export function isUuidLikeValue(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim())
}

export function value(v: string | null | undefined) {
  return v && v.trim() ? v : "—"
}

export function clean(v: string | number | null | undefined) {
  const trimmed = v == null ? undefined : String(v).trim()
  return trimmed || undefined
}

export function providerString(subscription: SubscriptionOut, key: string): string | null {
  const raw = subscription.provider_fields?.[key]
  if (raw == null) return null
  const text = String(raw).trim()
  return text || null
}

export function planDisplay(plan: SubscriptionOut["normalized"]["plan"]) {
  return clean(plan.name) ?? clean(plan.code) ?? clean(plan.id) ?? "—"
}

export function subscriptionStatusInfo(subscription: SubscriptionOut) {
  const normalized = subscription.normalized.status
  const providerStatus = clean(subscription.status) ?? "UNKNOWN"
  return {
    value: providerStatus,
    group: clean(normalized.group) ?? null,
  }
}

export function bytesToDataLabel(bytes: string | number | null | undefined) {
  const n = typeof bytes === "string" ? Number(bytes) : bytes
  if (!n || Number.isNaN(n)) return "0 MB"
  const mb = n / 1024 / 1024
  if (mb >= 1024) return `${(mb / 1024).toLocaleString("es-CO", { maximumFractionDigits: 2 })} GB`
  return `${mb.toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`
}

export function mbToLabel(mb: number | null | undefined) {
  if (mb == null) return "Sin límite contractual"
  if (mb >= 1024) return `${(mb / 1024).toLocaleString("es-CO", { maximumFractionDigits: 2 })} GB`
  return `${mb.toLocaleString("es-CO")} MB`
}

export function daysBetween(start: string, end: string) {
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 1
  return Math.max(1, Math.ceil((b - a) / 86_400_000))
}

export function errorMessage(err: unknown) {
  if (err && typeof err === "object") {
    const anyErr = err as { detail?: unknown; title?: unknown; message?: unknown; code?: unknown; extra?: unknown }
    const message = anyErr.detail || anyErr.title || anyErr.message
    const extra = anyErr.extra && typeof anyErr.extra === "object" ? anyErr.extra as Record<string, unknown> : undefined
    const retryAfter = extra?.retry_after
    const retryText = anyErr.code === "provider.rate_limited" && retryAfter ? ` Intenta de nuevo en ${String(retryAfter)}.` : ""
    return {
      message: `${typeof message === "string" ? message : "No pudimos cargar estos datos."}${retryText}`,
      code: typeof anyErr.code === "string" ? anyErr.code : undefined,
    }
  }
  return { message: "No pudimos cargar estos datos.", code: undefined }
}

export function actionErrorMessage(err: unknown) {
  const parsed = errorMessage(err)
  return parsed.message || "No pudimos ejecutar la acción."
}

export function metricNumber(v: string | number | null | undefined) {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : null
}

export function usageBars(usage: UsageOut) {
  const daily = usage.usage_metrics.filter((metric) => /data.*daily|daily.*data/i.test(metric.metric_type))
  const source = daily.length ? daily : usage.usage_metrics.filter((metric) => /data/i.test(metric.metric_type))
  const bars = source
    .map((metric) => ({ label: metric.metric_type.replace(/_/g, " "), value: metricNumber(metric.usage) ?? 0, unit: metric.unit ?? "" }))
    .filter((metric) => metric.value > 0)
  if (bars.length) return bars.slice(0, 30)

  const totalMb = (metricNumber(usage.data_used_bytes) ?? 0) / 1024 / 1024
  return [{ label: "Periodo", value: totalMb, unit: "MB" }]
}

export function mergedAttributes(subscription: SubscriptionOut) {
  return Object.entries({
    ...subscription.provider_fields,
    ...subscription.normalized.custom_fields,
  }).filter(([key, v]) => v !== undefined && !isTechnicalIdentifierField(key) && !isUuidLikeValue(v))
}

export function purgeBodyFor(provider: SubscriptionOut["provider"]) {
  if (provider === "kite") {
    return "Ejecuta networkReset en Kite. Reinicia la sesión y la IP, pero no cambia el estado."
  }
  if (provider === "tele2") {
    return "Acción destructiva. Transiciona la SIM a PURGED en Tele2. Estado terminal, no reversible."
  }
  return "Acción destructiva. Marca la SIM como purgada en Moabits. Permanente, no se puede deshacer."
}

export function presenceColor(state: "online" | "offline" | "unknown") {
  if (state === "online") return "#2D8A6F"
  if (state === "offline") return "#C85A4A"
  return "#555E6B"
}
