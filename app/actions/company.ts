"use server"

import { revalidatePath } from "next/cache"
import { fetchApi } from "@/lib/api-client"
import { z } from "zod"

const updateCompanySchema = z.object({
  name: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
})

export async function updateCompany(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name"),
    }

    const parsed = updateCompanySchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message }
    }

    await fetchApi("/companies/me", {
      method: "PUT",
      body: JSON.stringify(parsed.data),
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/company")
    return { success: true, message: "Empresa actualizada exitosamente" }
  } catch (error: any) {
    return { error: error.message || "No se pudo actualizar la empresa. ¿Eres Administrador?" }
  }
}
