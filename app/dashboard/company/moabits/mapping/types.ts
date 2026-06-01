import type {
  LocalCompanyMoabitsMappingOut,
  MoabitsCompanyOut,
} from "@/lib/types/api"

export type Draft = {
  companyId: string
  companyCode: string
  companyName: string
  clieId: string
}

export type EditorMode = "create" | "edit"

export type MoabitsOption = MoabitsCompanyOut & {
  source: "live" | "cache" | "mapping"
}

export type SearchOption = {
  value: string
  title: string
  detail?: string
  searchText: string
}

export type MappingPageInfo = {
  page: number
  pages: number | null
  size: number
  total: number | null
}

export type MappingSnapshot = {
  linkedRows: LocalCompanyMoabitsMappingOut[]
  pageInfo: MappingPageInfo
  allMappings: LocalCompanyMoabitsMappingOut[]
  cachedMoabitsCompanies: MoabitsCompanyOut[]
}
