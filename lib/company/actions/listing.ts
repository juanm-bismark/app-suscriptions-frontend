import { actionErrorMessage } from "@/lib/action-error"
import { fetchApi } from "@/lib/api-client"
import { CompanySchema, PageSchema } from "@/lib/api-validation"
import { requireAdmin } from "@/lib/auth/current-user"

export async function searchCompaniesAction(input?: { q?: string; page?: number; size?: number; limit?: number }) {
  await requireAdmin()

  try {
    const params = new URLSearchParams({
      page: String(input?.page ?? 1),
      size: String(input?.size ?? input?.limit ?? 20),
    })
    const q = input?.q?.trim()
    if (q) params.set("q", q)

    const page = await fetchApi(`/companies?${params.toString()}`, {
      schema: PageSchema(CompanySchema),
      cache: "no-store",
    })
    return {
      success: true,
      companies: page.items,
      total: page.total,
      page: page.page,
      size: page.size,
      pages: page.pages,
    }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudieron cargar las empresas") }
  }
}

export async function getCompanyByIdAction(id: string) {
  await requireAdmin()

  try {
    const company = await fetchApi(`/companies/${id}`, {
      schema: CompanySchema,
      cache: "no-store",
    })
    return { success: true, company }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudo cargar la empresa") }
  }
}

