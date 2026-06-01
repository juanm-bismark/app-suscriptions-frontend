import type {
  LocalCompanyMoabitsMappingOut,
  MoabitsCompanyOut,
  MoabitsProviderMappingDiscoveryOut,
} from "@/lib/types/api"
import { formatDateTime } from "@/lib/formatters"
import type { Draft, MoabitsOption, SearchOption } from "./types"

export function mergeMappings(
  current: LocalCompanyMoabitsMappingOut[],
  incoming: LocalCompanyMoabitsMappingOut[],
) {
  const byCompanyId = new Map<string, LocalCompanyMoabitsMappingOut>()
  current.forEach((company) => byCompanyId.set(company.company_id, company))
  incoming.forEach((company) => byCompanyId.set(company.company_id, company))

  return Array.from(byCompanyId.values()).sort((a, b) => a.company_name.localeCompare(b.company_name))
}

export function mergeMoabitsCompanies(current: MoabitsCompanyOut[], incoming: MoabitsCompanyOut[]) {
  const byCompanyCode = new Map<string, MoabitsCompanyOut>()
  current.forEach((company) => byCompanyCode.set(company.companyCode, company))
  incoming.forEach((company) => byCompanyCode.set(company.companyCode, company))

  return Array.from(byCompanyCode.values()).sort((a, b) => a.companyName.localeCompare(b.companyName))
}

export function findMappedCompany(mappings: LocalCompanyMoabitsMappingOut[], companyId: string) {
  return mappings.find((company) => company.company_id === companyId) ?? null
}

export function buildMoabitsOptions({
  liveCompanies,
  cachedCompanies,
  mappings,
}: {
  liveCompanies: MoabitsProviderMappingDiscoveryOut["moabits_companies"] | null
  cachedCompanies: MoabitsCompanyOut[]
  mappings: LocalCompanyMoabitsMappingOut[]
}) {
  const options = new Map<string, MoabitsOption>()

  function addCompany(company: MoabitsCompanyOut, source: MoabitsOption["source"]) {
    if (!company.companyCode) return
    options.set(company.companyCode, {
      companyCode: company.companyCode,
      companyName: company.companyName,
      clie_id: company.clie_id,
      source,
    })
  }

  liveCompanies?.forEach((company) => addCompany(company, "live"))

  cachedCompanies.forEach((company) => {
    if (options.has(company.companyCode)) return
    addCompany(company, "cache")
  })

  mappings.forEach((company) => {
    const mapping = company.mapping
    if (!mapping || options.has(mapping.companyCode)) return

    addCompany({
      companyCode: mapping.companyCode,
      companyName: mapping.companyName ?? mapping.companyCode,
      clie_id: mapping.clie_id,
    }, "mapping")
  })

  return Array.from(options.values()).sort((a, b) => a.companyName.localeCompare(b.companyName))
}

export function buildLocalCompanySearchOptions(mappings: LocalCompanyMoabitsMappingOut[]): SearchOption[] {
  return mappings.map((company) => ({
    value: company.company_id,
    title: company.company_name,
    detail: company.company_id,
    searchText: [
      company.company_name,
      company.company_id,
      company.mapping?.companyCode,
      company.mapping?.companyName,
      company.mapping?.clie_id,
    ].filter(Boolean).join(" "),
  }))
}

export function buildMoabitsSearchOptions(options: MoabitsOption[]): SearchOption[] {
  return options.map((company) => ({
    value: company.companyCode,
    title: company.companyName,
    detail: `${company.companyCode} · clie_id ${company.clie_id ?? "sin dato"} · ${sourceLabel(company.source)}`,
    searchText: [
      company.companyName,
      company.companyCode,
      company.clie_id,
      sourceLabel(company.source),
    ].filter(Boolean).join(" "),
  }))
}

export function findMoabitsOption(options: MoabitsOption[], companyCode: string) {
  return options.find((company) => company.companyCode === companyCode) ?? null
}

export function namesAreEqual(localName?: string, moabitsName?: string) {
  if (!localName || !moabitsName) return false
  return localName.trim().toLowerCase() === moabitsName.trim().toLowerCase()
}

export function formatDate(value?: string | null) {
  return formatDateTime(value, {
    fallback: "Sin dato",
    invalidFallback: "Fecha invalida",
    locale: "es",
  })
}

export function sourceLabel(source: MoabitsOption["source"]) {
  if (source === "live") return "Moabits en vivo"
  if (source === "cache") return "Cache Moabits"
  return "Vinculo guardado"
}

export function sourceDetail(source: MoabitsOption["source"]) {
  if (source === "live") return "catalogo en vivo"
  if (source === "cache") return "cache Moabits"
  return "guardado en vinculaciones"
}

export function withSelectedMoabitsOption(options: SearchOption[], draft: Draft) {
  const code = draft.companyCode
  const cleanCode = code.trim()
  if (!cleanCode || options.some((option) => option.value === code || option.value === cleanCode)) {
    return options
  }

  const cleanName = draft.companyName.trim()
  const cleanClieId = draft.clieId.trim()
  return [
    {
      value: code,
      title: cleanName || cleanCode,
      detail: `${cleanCode} · clie_id ${cleanClieId || "sin dato"} · valor actual`,
      searchText: [cleanName, cleanCode, cleanClieId, "valor actual"].filter(Boolean).join(" "),
    },
    ...options,
  ]
}
