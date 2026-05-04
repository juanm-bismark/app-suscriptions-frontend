"use server"

import { revalidatePath } from "next/cache"
import { fetchApi } from "@/lib/api-client"
import { z } from "zod"

const updateProfileSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
})

export async function updateProfile(formData: FormData) {
  try {
    const rawData = {
      full_name: formData.get("full_name"),
    }

    const parsed = updateProfileSchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    await fetchApi("/me", {
      method: "PUT",
      body: JSON.stringify(parsed.data),
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/profile")
    return { success: true, message: "Perfil actualizado exitosamente" }
  } catch (error: any) {
    return { error: error.message || "No se pudo actualizar el perfil" }
  }
}
