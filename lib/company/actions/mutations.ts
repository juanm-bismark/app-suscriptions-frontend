import { actionErrorMessage, firstZodIssue } from "@/lib/action-error"
import { fetchApi } from "@/lib/api-client"
import { CompanySchema } from "@/lib/api-validation"
import { requireAdmin } from "@/lib/auth/current-user"
import { deleteCompanySchema, createCompanySchema, updateCompanySchema } from "./schemas"
import { revalidateCompanySurfaces } from "./revalidate"

export async function createCompanyAction(formData: FormData) {
  await requireAdmin()

  try {
    const parsed = createCompanySchema.safeParse({
      name: formData.get("name"),
    })
    if (!parsed.success) {
      return { error: firstZodIssue(parsed.error) }
    }

    const company = await fetchApi("/companies", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      schema: CompanySchema,
    })

    revalidateCompanySurfaces()
    return { success: true, message: "Empresa creada exitosamente", company }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudo crear la empresa. ¿Eres Administrador?") }
  }
}

export async function updateCompanyAction(formData: FormData) {
  await requireAdmin()

  try {
    const parsed = updateCompanySchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
    })
    if (!parsed.success) {
      return { error: firstZodIssue(parsed.error) }
    }

    const { id, ...body } = parsed.data
    const company = await fetchApi(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
      schema: CompanySchema,
    })

    revalidateCompanySurfaces()
    return { success: true, message: "Empresa actualizada exitosamente", company }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudo actualizar la empresa. ¿Eres Administrador?") }
  }
}

export async function deleteCompanyAction(formData: FormData) {
  await requireAdmin()

  try {
    const parsed = deleteCompanySchema.safeParse({
      id: formData.get("id"),
    })

    if (!parsed.success) {
      return { error: firstZodIssue(parsed.error) }
    }

    await fetchApi(`/companies/${parsed.data.id}`, {
      method: "DELETE",
    })

    revalidateCompanySurfaces()
    return { success: true, message: "Empresa eliminada" }
  } catch (error: unknown) {
    return { error: actionErrorMessage(error, "No se pudo eliminar la empresa. ¿Eres Administrador?") }
  }
}

