import {
  listMoabitsProviderMappings,
  listMoabitsSourceCompanies,
} from "@/app/actions/company"
import type { LocalCompanyMoabitsMappingOut, MoabitsCompanyOut } from "@/lib/types/api"
import { EDITOR_COMPANY_PAGE_SIZE, MOABITS_SOURCE_PAGE_SIZE } from "./constants"
import type { MappingSnapshot } from "./types"
import { mergeMappings, mergeMoabitsCompanies } from "./utils"

type LoadResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function loadMappingManagerSnapshot({
  page,
  size,
  query,
}: {
  page: number
  size: number
  query: string
}): Promise<LoadResult<MappingSnapshot>> {
  const [tableResult, allResult, cacheResult] = await Promise.all([
    listMoabitsProviderMappings({ page, size, q: query, linkedOnly: true }),
    loadAllMappingsFromDb(),
    loadMoabitsSourceCompaniesFromCache(),
  ])

  if (tableResult.success !== true) {
    return { success: false, error: tableResult.error ?? "No se pudieron actualizar las vinculaciones Moabits." }
  }
  if (allResult.success !== true) {
    return { success: false, error: allResult.error }
  }
  if (cacheResult.success !== true) {
    return { success: false, error: cacheResult.error }
  }

  return {
    success: true,
    data: {
      linkedRows: tableResult.data.items,
      pageInfo: {
        page: tableResult.data.page,
        pages: tableResult.data.pages,
        size: tableResult.data.size,
        total: tableResult.data.total,
      },
      allMappings: mergeMappings(tableResult.data.items, allResult.data),
      cachedMoabitsCompanies: cacheResult.data,
    },
  }
}

export async function loadAllMappingsFromDb(): Promise<LoadResult<LocalCompanyMoabitsMappingOut[]>> {
  const firstResult = await listMoabitsProviderMappings({ page: 1, size: EDITOR_COMPANY_PAGE_SIZE })
  if (firstResult.success !== true) {
    return {
      success: false,
      error: firstResult.error ?? "No se pudieron cargar los datos de empresas.",
    }
  }

  const items = [...firstResult.data.items]
  const pageSize = firstResult.data.size || EDITOR_COMPANY_PAGE_SIZE
  const pages = firstResult.data.pages ?? (firstResult.data.total ? Math.ceil(firstResult.data.total / pageSize) : 1)

  if (pages > 1) {
    const pageResults = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        listMoabitsProviderMappings({ page: index + 2, size: pageSize }),
      ),
    )

    for (const result of pageResults) {
      if (result.success !== true) {
        return {
          success: false,
          error: result.error ?? "No se pudieron cargar todos los datos de empresas.",
        }
      }
      items.push(...result.data.items)
    }
  }

  return { success: true, data: mergeMappings([], items) }
}

export async function loadMoabitsSourceCompaniesFromCache(): Promise<LoadResult<MoabitsCompanyOut[]>> {
  const firstResult = await listMoabitsSourceCompanies({ page: 1, size: MOABITS_SOURCE_PAGE_SIZE, activeOnly: true })
  if (firstResult.success !== true) {
    return {
      success: false,
      error: firstResult.error ?? "No se pudieron cargar las companias Moabits en cache.",
    }
  }

  const items: MoabitsCompanyOut[] = [...firstResult.data.items]
  const pageSize = firstResult.data.size || MOABITS_SOURCE_PAGE_SIZE
  const pages = firstResult.data.pages ?? (firstResult.data.total ? Math.ceil(firstResult.data.total / pageSize) : 1)

  if (pages > 1) {
    const pageResults = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        listMoabitsSourceCompanies({ page: index + 2, size: pageSize, activeOnly: true }),
      ),
    )

    for (const result of pageResults) {
      if (result.success !== true) {
        return {
          success: false,
          error: result.error ?? "No se pudieron cargar todas las companias Moabits en cache.",
        }
      }
      items.push(...result.data.items)
    }
  }

  return { success: true, data: mergeMoabitsCompanies([], items) }
}
