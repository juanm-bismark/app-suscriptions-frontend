import type { Provider } from "@/lib/types/api"

export interface NativeStatusMeta {
  value: string
  label: string
  tone: "success" | "test" | "warn" | "danger" | "neutral" | "info"
}

export const PROVIDER_NATIVE_STATUSES: Record<Provider, NativeStatusMeta[]> = {
  kite: [
    { value: "ACTIVE", label: "Activa", tone: "success" },
    { value: "TEST", label: "En prueba", tone: "test" },
    { value: "ACTIVATION_READY", label: "Lista p/ activar", tone: "info" },
    { value: "ACTIVATION_PENDANT", label: "Pendiente activ.", tone: "info" },
    { value: "INACTIVE_NEW", label: "Inactiva (nueva)", tone: "info" },
    { value: "DEACTIVATED", label: "Desactivada", tone: "warn" },
    { value: "SUSPENDED", label: "Suspendida", tone: "warn" },
    { value: "RESTORE", label: "Restauración", tone: "info" },
    { value: "RETIRED", label: "Retirada", tone: "neutral" },
  ],
  tele2: [
    { value: "ACTIVATED", label: "Activa", tone: "success" },
    { value: "TEST_READY", label: "Lista p/ prueba", tone: "test" },
    { value: "ACTIVATION_READY", label: "Lista p/ activar", tone: "info" },
    { value: "INVENTORY", label: "Inventario", tone: "neutral" },
    { value: "DEACTIVATED", label: "Desactivada", tone: "warn" },
    { value: "REPLACED", label: "Reemplazada", tone: "neutral" },
    { value: "RETIRED", label: "Retirada", tone: "neutral" },
    { value: "PURGED", label: "Purgada", tone: "danger" },
  ],
  moabits: [
    { value: "Active", label: "Activa", tone: "success" },
    { value: "Ready", label: "Lista", tone: "info" },
    { value: "Suspended", label: "Suspendida", tone: "warn" },
  ],
}

export type NativeStatusSelections = Partial<Record<Provider, Set<string>>>

export function normalizeStatusValue(value: string | null | undefined) {
  return (value ?? "").trim()
}

export function statusKey(value: string | null | undefined) {
  return normalizeStatusValue(value).toLowerCase()
}

export function isSelectedStatus(selected: string | null | undefined, candidate: string | null | undefined) {
  return Boolean(selected?.trim()) && statusKey(selected) === statusKey(candidate)
}

export function isKnownNativeStatus(provider: Provider, value: string | null | undefined) {
  const key = statusKey(value)
  return Boolean(key && PROVIDER_NATIVE_STATUSES[provider].some((status) => statusKey(status.value) === key))
}

export function canonicalNativeStatus(provider: Provider, value: string) {
  return PROVIDER_NATIVE_STATUSES[provider].find((status) => statusKey(status.value) === statusKey(value))?.value ?? value
}

export function parseStatusSelections(
  value: string | null | undefined,
  providerIds: readonly Provider[],
): NativeStatusSelections {
  const active = new Set(providerIds)
  const selections: NativeStatusSelections = {}

  for (const raw of (value ?? "").split(",")) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const separator = trimmed.indexOf(":")
    if (separator <= 0) continue

    const provider = trimmed.slice(0, separator)
    const status = trimmed.slice(separator + 1)
    if (!active.has(provider as Provider)) continue
    const source = provider as Provider
    if (!isKnownNativeStatus(source, status)) continue

    selections[source] = selections[source] ?? new Set<string>()
    selections[source]?.add(canonicalNativeStatus(source, status))
  }

  return selections
}

export function serializeStatusSelections(selections: NativeStatusSelections, providerIds: readonly Provider[]) {
  const parts: string[] = []
  for (const provider of providerIds) {
    for (const status of selections[provider] ?? []) {
      parts.push(`${provider}:${status}`)
    }
  }
  return parts.length ? parts.join(",") : null
}

export function hasStatusSelections(selections: NativeStatusSelections, providerIds: readonly Provider[]) {
  return providerIds.some((provider) => (selections[provider]?.size ?? 0) > 0)
}

export function countStatusSelections(selections: NativeStatusSelections, providerIds: readonly Provider[]) {
  return providerIds.reduce((total, provider) => total + (selections[provider]?.size ?? 0), 0)
}

export function toggleStatusSelection(selections: NativeStatusSelections, provider: Provider, status: string): NativeStatusSelections {
  const next: NativeStatusSelections = { ...selections }
  const providerStatuses = new Set(next[provider] ?? [])
  if (providerStatuses.has(status)) providerStatuses.delete(status)
  else providerStatuses.add(status)

  if (providerStatuses.size) next[provider] = providerStatuses
  else delete next[provider]
  return next
}

export function nativeStatusMeta(
  provider: Provider,
  value: string | null | undefined,
): NativeStatusMeta {
  const v = (value ?? "").trim()
  if (v) {
    const found = PROVIDER_NATIVE_STATUSES[provider]?.find(
      (status) => status.value.toLowerCase() === v.toLowerCase(),
    )
    if (found) return found
    return { value: v, label: v, tone: "neutral" }
  }
  return { value: "", label: "Desconocida", tone: "neutral" }
}
