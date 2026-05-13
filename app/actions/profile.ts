"use server"

import { revalidatePath } from "next/cache"
import { fetchApi } from "@/lib/api-client"
import { z } from "zod"

const updateProfileSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres").optional(),
})

export async function updateProfile(formData: FormData) {
  try {
    const password = formData.get("password")
    const rawData = {
      full_name: formData.get("full_name"),
      password: typeof password === "string" && password.length > 0 ? password : undefined,
    }

    const parsed = updateProfileSchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    await fetchApi("/me", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/profile")
    return { success: true, message: "Perfil actualizado exitosamente" }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo actualizar el perfil" }
  }
}
