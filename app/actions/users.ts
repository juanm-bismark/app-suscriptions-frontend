"use server"

import { revalidatePath } from "next/cache"
import { fetchApi } from "@/lib/api-client"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres"),
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  role: z.enum(["admin", "manager", "member"], { error: "Rol inválido" }),
})

const updateUserSchema = z.object({
  id: z.string().uuid("Usuario inválido"),
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  role: z.enum(["admin", "manager", "member"], { error: "Rol inválido" }).optional(),
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
      return { error: parsed.error.issues[0].message }
    }

    await fetchApi("/users", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    })

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario creado exitosamente" }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo crear el usuario. ¿Tienes permisos?" }
  }
}

export async function updateUser(formData: FormData) {
  try {
    const role = formData.get("role")
    const rawData = {
      id: formData.get("id"),
      full_name: formData.get("full_name"),
      role: typeof role === "string" && role.length > 0 ? role : undefined,
    }

    const parsed = updateUserSchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { id, ...body } = parsed.data
    await fetchApi(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario actualizado" }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo actualizar el usuario. ¿Tienes permisos?" }
  }
}
