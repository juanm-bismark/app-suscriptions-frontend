"use server"

import { revalidatePath } from "next/cache"
import { ApiError, fetchApi } from "@/lib/api-client"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import type {
  CompanyProviderMappingIn,
  CompanyProviderMappingOut,
  LocalCompanyMoabitsMappingOut,
  MoabitsProviderMappingDiscoveryOut,
  MoabitsSourceCompanyOut,
} from "@/lib/types/api"
import type { Company, Page } from "@/lib/types/user"
import { z } from "zod"

const companyNameSchema = z.string().trim().min(2, "El nombre de la empresa debe tener al menos 2 caracteres")

const createCompanySchema = z.object({
  name: companyNameSchema,
})

const updateCompanySchema = z.object({
  id: z.string().uuid("Empresa inválida"),
  name: companyNameSchema,
})

const deleteCompanySchema = z.object({
  id: z.string().uuid("Empresa inválida"),
})

export async function searchCompanies(input?: { q?: string; page?: number; size?: number; limit?: number }) {
  await requireAdmin()

  try {
    const params = new URLSearchParams({
      page: String(input?.page ?? 1),
      size: String(input?.size ?? input?.limit ?? 20),
    })
    const q = input?.q?.trim()
    if (q) params.set("q", q)

    const page = await fetchApi<Page<Company>>(`/companies?${params.toString()}`, { cache: "no-store" })
    return {
      success: true,
      companies: page.items,
      total: page.total,
      page: page.page,
      size: page.size,
      pages: page.pages,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudieron cargar las empresas" }
  }
}

export async function getCompanyById(id: string) {
  await requireAdmin()

  try {
    const company = await fetchApi<Company>(`/companies/${id}`, { cache: "no-store" })
    return { success: true, company }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo cargar la empresa" }
  }
}

export async function createCompany(formData: FormData) {
  await requireAdmin()

  try {
    const parsed = createCompanySchema.safeParse({
      name: formData.get("name"),
    })
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const company = await fetchApi<Company>("/companies", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/company")
    revalidatePath("/dashboard/company/moabits")
    revalidatePath("/dashboard/credentials")
    return { success: true, message: "Empresa creada exitosamente", company }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo crear la empresa. ¿Eres Administrador?" }
  }
}

export async function updateCompany(formData: FormData) {
  await requireAdmin()

  try {
    const rawData = {
      id: formData.get("id"),
      name: formData.get("name"),
    }

    const parsed = updateCompanySchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { id, ...body } = parsed.data
    const company = await fetchApi<Company>(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/company")
    revalidatePath("/dashboard/company/moabits")
    revalidatePath("/dashboard/credentials")
    return { success: true, message: "Empresa actualizada exitosamente", company }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo actualizar la empresa. ¿Eres Administrador?" }
  }
}

export async function deleteCompany(formData: FormData) {
  await requireAdmin()

  try {
    const parsed = deleteCompanySchema.safeParse({
      id: formData.get("id"),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    await fetchApi<Record<string, never>>(`/companies/${parsed.data.id}`, {
      method: "DELETE",
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/company")
    revalidatePath("/dashboard/company/moabits")
    revalidatePath("/dashboard/credentials")
    return { success: true, message: "Empresa eliminada" }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo eliminar la empresa. ¿Eres Administrador?" }
  }
}


export async function getMyMoabitsProviderMapping() {
  await requireManagerOrAdmin()

  try {
    const data = await fetchApi<CompanyProviderMappingOut>("/companies/me/provider-mappings/moabits")
    return { ok: true as const, data }
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: true as const, data: null }
    }

    const message = error instanceof Error ? error.message : null
    return { ok: false as const, error: message || "No se pudo cargar la vinculacion Moabits de tu empresa" }
  }
}

export async function discoverMoabitsProviderMappings() {
  await requireAdmin()

  try {
    const data = await fetchApi<MoabitsProviderMappingDiscoveryOut>(
      "/companies/provider-mappings/moabits/discover",
      { cache: "no-store" }
    )
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo cargar el descubrimiento de vinculaciones Moabits" }
  }
}

export async function listMoabitsSourceCompanies(input?: {
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

    const data = await fetchApi<Page<MoabitsSourceCompanyOut>>(
      `/companies/provider-mappings/moabits/source-companies?${params.toString()}`,
      { cache: "no-store" }
    )
    return { success: true as const, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudieron cargar las companias Moabits en cache" }
  }
}

export async function listMoabitsProviderMappings(input?: {
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

    const data = await fetchApi<Page<LocalCompanyMoabitsMappingOut>>(
      `/companies/provider-mappings/moabits?${params.toString()}`,
      { cache: "no-store" }
    )
    return { success: true as const, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudieron cargar las vinculaciones Moabits" }
  }
}

export async function upsertMoabitsProviderMapping(companyId: string, body: CompanyProviderMappingIn) {
  await requireAdmin()

  try {
    const data = await fetchApi<CompanyProviderMappingOut>(
      `/companies/${companyId}/provider-mappings/moabits`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    )
    revalidatePath("/dashboard/company")
    revalidatePath("/dashboard/company/moabits")
    return { success: true, mapping: data }
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 422) {
      return {
        error: "Esta compañía Moabits no está disponible en el scope guardado ni en el discovery en vivo.",
      }
    }

    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo guardar la vinculacion Moabits" }
  }
}

export async function deleteMoabitsProviderMapping(companyId: string) {
  await requireAdmin()

  try {
    await fetchApi<Record<string, never>>(
      `/companies/${companyId}/provider-mappings/moabits`,
      { method: "DELETE" }
    )
    revalidatePath("/dashboard/company")
    revalidatePath("/dashboard/company/moabits")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo quitar la vinculacion Moabits" }
  }
}
