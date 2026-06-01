import type { Provider } from "@/lib/types/api"

export interface ProviderMeta {
  id: Provider
  name: string
  shortName: string
  color: string
  tintBg: string
  tintText: string
  description: string
}

export const PROVIDER_META: Record<Provider, ProviderMeta> = {
  kite: {
    id: "kite",
    name: "Kite",
    shortName: "KT",
    color: "#33A6B2",
    tintBg: "#E0F2F3",
    tintText: "#0F5F67",
    description: "Fibra optica residencial",
  },
  tele2: {
    id: "tele2",
    name: "Tele2",
    shortName: "T2",
    color: "#7B4FE0",
    tintBg: "#EDE5FB",
    tintText: "#422889",
    description: "Telefonia movil + datos",
  },
  moabits: {
    id: "moabits",
    name: "Moabits",
    shortName: "MB",
    color: "#E07A3A",
    tintBg: "#FCEADC",
    tintText: "#7A3A10",
    description: "Servicios corporativos / IoT",
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDER_META) as Provider[]

export function isProvider(value: string | null | undefined): value is Provider {
  return !!value && PROVIDER_IDS.includes(value as Provider)
}

export function providerDisplayName(provider: Provider) {
  return PROVIDER_META[provider].name
}
