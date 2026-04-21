"use server"

import { revalidatePath } from "next/cache"
import { fetchApi } from "@/lib/api-client"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres"),
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  role: z.enum(["admin", "manager", "member"], {
    errorMap: () => ({ message: "Rol inválido" }),
  }),
})

export async function createUser(formData: FormData) {
  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      full_name: formData.get("full_name"),
      role: formData.get("role"),
    }

    const parsed = createUserSchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.errors[0].message }
    }

    await fetchApi("/users", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario creado exitosamente" }
  } catch (error: any) {
    return { error: error.message || "No se pudo crear el usuario. ¿Tienes permisos?" }
  }
}
