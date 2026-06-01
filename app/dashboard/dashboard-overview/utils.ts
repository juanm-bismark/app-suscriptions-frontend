import { PROVIDER_IDS, providerDisplayName } from "@/lib/provider-meta"
import type { Provider } from "@/lib/types/api"
import type { ProviderCardItem } from "./types"

export const PROVIDERS: Provider[] = PROVIDER_IDS

export const PROVIDER_CARD_CLASSES: Record<Provider, string> = {
  kite: "bg-provider-kite-soft",
  tele2: "bg-provider-tele2-soft",
  moabits: "bg-provider-moabits-soft",
}

export function providerNames(providers: Provider[]) {
  return providers.map(providerDisplayName).join(", ") || "Sin proveedores"
}

export function getProviderCardDescription(item: ProviderCardItem) {
  if (item.status === "loading") return "Consultando conexion"
  if (item.error) return item.error
  if (item.status === "not_queried") return "Con credencial activa"
  if (item.status === "partial") return "Conexion parcial"
  if (item.status === "ok") return "Conectado"
  return "Sin respuesta"
}

export function getProviderStatusClassName(item: Pick<ProviderCardItem, "status">) {
  const base = "rounded-full px-2.5 py-1 text-xs font-semibold"

  if (item.status === "loading") {
    return `${base} bg-white/70 text-table-header-text`
  }

  if (item.status === "partial") {
    return `${base} bg-warning-soft text-warning-icon-soft`
  }

  if (item.status === "not_queried") {
    return `${base} bg-white/70 text-slate-muted`
  }

  if (item.status === "error") {
    return `${base} bg-danger-tint text-danger-strong-text`
  }

  return `${base} bg-success-soft text-success-text-soft`
}
