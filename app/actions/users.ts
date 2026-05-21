"use server"

import { revalidatePath } from "next/cache"
import { fetchApi } from "@/lib/api-client"
import { requireAdmin, requireManagerOrAdmin } from "@/lib/auth/current-user"
import { ROLES } from "@/lib/types/user"
import { z } from "zod"

const createUserSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres"),
  full_name: z.preprocess(
    (v) => (!v ? undefined : v),
    z.string().min(2, "Mínimo 2 caracteres").optional()
  ),
  role: z.enum(["admin", "manager", "member", "public"], { error: "Rol inválido" }),
  company_id: z.preprocess(
    (v) => (!v ? undefined : v),
    z.string().uuid("Empresa inválida").optional()
  ),
})

const updateUserSchema = z.object({
  id: z.string().uuid("Usuario inválido"),
  full_name: z.preprocess(
    (v) => (!v ? undefined : v),
    z.string().min(2, "Mínimo 2 caracteres").optional()
  ),
  email: z.email("Correo inválido").optional(),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres").optional(),
  role: z.enum(["admin", "manager", "member", "public"], { error: "Rol inválido" }).optional(),
})

const deleteUserSchema = z.object({
  id: z.string().uuid("Usuario inválido"),
})

export async function createUser(formData: FormData) {
  const profile = await requireManagerOrAdmin()

  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      full_name: formData.get("full_name"),
      role: formData.get("role"),
      company_id: formData.get("company_id"),
    }

    const parsed = createUserSchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }
    if (profile.role === ROLES.MANAGER && parsed.data.role !== ROLES.MEMBER) {
      return { error: "Managers solo pueden crear miembros" }
    }
    if (profile.role === ROLES.ADMIN && !parsed.data.company_id) {
      return { error: "Debes seleccionar una empresa" }
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
  const profile = await requireManagerOrAdmin()

  try {
    const role = formData.get("role")
    const password = formData.get("password")
    const email = formData.get("email")
    const rawData = {
      id: formData.get("id"),
      full_name: formData.get("full_name"),
      email: typeof email === "string" && email.length > 0 ? email : undefined,
      password: typeof password === "string" && password.length > 0 ? password : undefined,
      role: typeof role === "string" && role.length > 0 ? role : undefined,
    }

    const parsed = updateUserSchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }
    if (profile.role === ROLES.MANAGER && parsed.data.role && parsed.data.role !== ROLES.MEMBER) {
      return { error: "Managers solo pueden asignar el rol miembro" }
    }

    const { id, ...body } = parsed.data
    await fetchApi(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario actualizado" }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo actualizar el usuario. ¿Tienes permisos?" }
  }
}

export async function deleteUser(formData: FormData) {
  await requireAdmin()

  try {
    const parsed = deleteUserSchema.safeParse({
      id: formData.get("id"),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    await fetchApi(`/users/${parsed.data.id}`, {
      method: "DELETE",
    })

    revalidatePath("/dashboard/users")
    return { success: true, message: "Usuario eliminado" }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : null
    return { error: message || "No se pudo eliminar el usuario. ¿Tienes permisos?" }
  }
}
