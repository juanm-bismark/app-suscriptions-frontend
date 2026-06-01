import { actionErrorMessage } from "@/lib/action-error"
import { ApiError, fetchApi } from "@/lib/api-client"
import {
  CompanyProviderMappingOutSchema,
  LocalCompanyMoabitsMappingOutSchema,
  MoabitsProviderMappingDiscoveryOutSchema,
  MoabitsSourceCompanyOutSchema,
  PageSchema,
} from "@/lib/api-validation"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import type { CompanyProviderMappingIn } from "@/lib/types/api"
import { revalidateMoabitsMappingSurfaces } from "./revalidate"

export async function getMyMoabitsProviderMappingAction() {
  await requireManagerOrAdmin()

  try {
    const data = await fetchApi("/companies/me/provider-mappings/moabits", {
      schema: CompanyProviderMappingOutSchema,
    })
    return { ok: true as const, data }
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: true as const, data: null }
    }

    return { ok: false as const, error: actionErrorMessage(error, "No se pudo cargar la vinculacion Moabits de tu empresa") }
  }
}

export async function discoverMoabitsProviderMappingsAction() {
  await requireAdmin()

  try {
    const data = await fetchApi("/companies/provider-mappings/moabits/discover", {
      schema: MoabitsProviderMappingDiscoveryOutSchema,
      cache: "no-store",
    })
    return { success: true, data }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudo cargar el descubrimiento de vinculaciones Moabits") }
  }
}

export async function listMoabitsSourceCompaniesAction(input?: {
  q?: string
  page?: number
  size?: number
  activeOnly?: boolean
}) {
  await requireAdmin()

  try {
    const params = new URLSearchParams({
      page: String(input?.page ?? 1),
      size: String(input?.size ?? 20),
    })
    if (input?.q?.trim()) params.set("q", input.q.trim())
    if (input?.activeOnly !== undefined) params.set("active_only", String(input.activeOnly))

    const data = await fetchApi(`/companies/provider-mappings/moabits/source-companies?${params.toString()}`, {
      schema: PageSchema(MoabitsSourceCompanyOutSchema),
      cache: "no-store",
    })
    return { success: true as const, data }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudieron cargar las companias Moabits en cache") }
  }
}

export async function listMoabitsProviderMappingsAction(input?: {
  q?: string
  page?: number
  size?: number
  linkedOnly?: boolean
}) {
  await requireAdmin()

  try {
    const params = new URLSearchParams({
      page: String(input?.page ?? 1),
      size: String(input?.size ?? 20),
    })
    if (input?.q?.trim()) params.set("q", input.q.trim())
    if (input?.linkedOnly) params.set("linked_only", "true")

    const data = await fetchApi(`/companies/provider-mappings/moabits?${params.toString()}`, {
      schema: PageSchema(LocalCompanyMoabitsMappingOutSchema),
      cache: "no-store",
    })
    return { success: true as const, data }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudieron cargar las vinculaciones Moabits") }
  }
}

export async function upsertMoabitsProviderMappingAction(companyId: string, body: CompanyProviderMappingIn) {
  await requireAdmin()

  try {
    const data = await fetchApi(`/companies/${companyId}/provider-mappings/moabits`, {
      method: "PUT",
      body: JSON.stringify(body),
      schema: CompanyProviderMappingOutSchema,
    })
    revalidateMoabitsMappingSurfaces()
    return { success: true, mapping: data }
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 422) {
      return {
        error: "Esta compañía Moabits no está disponible en el scope guardado ni en el discovery en vivo.",
      }
    }

    return { error: actionErrorMessage(error, "No se pudo guardar la vinculacion Moabits") }
  }
}

export async function deleteMoabitsProviderMappingAction(companyId: string) {
  await requireAdmin()

  try {
    await fetchApi(`/companies/${companyId}/provider-mappings/moabits`, { method: "DELETE" })
    revalidateMoabitsMappingSurfaces()
    return { success: true }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudo quitar la vinculacion Moabits") }
  }
}

