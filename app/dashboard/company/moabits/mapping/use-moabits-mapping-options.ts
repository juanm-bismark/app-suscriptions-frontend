"use client"

import { useMemo } from "react"
import type {
  LocalCompanyMoabitsMappingOut,
  MoabitsCompanyOut,
  MoabitsProviderMappingDiscoveryOut,
} from "@/lib/types/api"
import type { Draft } from "./types"
import {
  buildLocalCompanySearchOptions,
  buildMoabitsOptions,
  buildMoabitsSearchOptions,
  findMappedCompany,
  findMoabitsOption,
  namesAreEqual,
  withSelectedMoabitsOption,
} from "./utils"

export function useMoabitsMappingOptions({
  allMappings,
  cachedMoabitsCompanies,
  discovery,
  draft,
}: {
  allMappings: LocalCompanyMoabitsMappingOut[]
  cachedMoabitsCompanies: MoabitsCompanyOut[]
  discovery: MoabitsProviderMappingDiscoveryOut | null
  draft: Draft
}) {
  const localCompanyOptions = useMemo(() => buildLocalCompanySearchOptions(allMappings), [allMappings])
  const moabitsOptions = useMemo(
    () =>
      buildMoabitsOptions({
        liveCompanies: discovery?.moabits_companies ?? null,
        cachedCompanies: cachedMoabitsCompanies,
        mappings: allMappings,
      }),
    [discovery, cachedMoabitsCompanies, allMappings],
  )
  const baseMoabitsSearchOptions = useMemo(() => buildMoabitsSearchOptions(moabitsOptions), [moabitsOptions])
  const moabitsSearchOptions = useMemo(
    () => withSelectedMoabitsOption(baseMoabitsSearchOptions, draft),
    [baseMoabitsSearchOptions, draft],
  )

  const selectedLocalCompany = findMappedCompany(allMappings, draft.companyId)
  const selectedMoabitsCompany = findMoabitsOption(moabitsOptions, draft.companyCode)
  const selectedMoabitsTitle =
    selectedMoabitsCompany?.companyName || draft.companyName || (draft.companyCode ? draft.companyCode : "Sin seleccionar")
  const selectedMoabitsDetail =
    selectedMoabitsCompany?.companyCode || draft.companyCode || "Selecciona una empresa Moabits"
  const selectedMapping = selectedLocalCompany?.mapping ?? null
  const linkedElsewhere = allMappings.filter(
    (item) => item.company_id !== draft.companyId && item.mapping?.companyCode === draft.companyCode,
  )
  const namesMatch = namesAreEqual(selectedLocalCompany?.company_name, selectedMoabitsCompany?.companyName)
  const moabitsOptionSource = discovery ? "Moabits en vivo" : "Cache Moabits"

  return {
    linkedElsewhere,
    localCompanyOptions,
    moabitsOptionSource,
    moabitsOptions,
    moabitsSearchOptions,
    namesMatch,
    selectedLocalCompany,
    selectedMapping,
    selectedMoabitsCompany,
    selectedMoabitsDetail,
    selectedMoabitsTitle,
  }
}
