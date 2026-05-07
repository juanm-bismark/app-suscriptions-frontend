"use server"

import { ApiError } from "@/lib/api-client"
import { signup } from "@/lib/api/auth"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  full_name: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(2, "Nombre requerido").optional()
  ),
  company_name: z.string().min(1, "Empresa requerida"),
})

type RegisterResult = { success: true } | { error: string }

export async function registerUser(
  data: z.infer<typeof registerSchema>
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error: "Datos inválidos",
    }
  }

  try {
    const tokenResponse = await signup({
      email: parsed.data.email,
      password: parsed.data.password,
      company_name: parsed.data.company_name,
      full_name: parsed.data.full_name || null,
    })

    if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
      return {
        error: "Respuesta de registro inválida",
      }
    }

    return {
      success: true,
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        if (error.detail === "Email already exists") {
          return { error: "Ya existe una cuenta con este correo" }
        }

        if (error.detail === "Company name already exists") {
          return { error: "Ya existe una empresa con este nombre" }
        }
      }

      return {
        error: error.detail || error.message || "Error al registrar",
      }
    }

    return {
      error: "Error de conexión con el servidor",
    }
  }
}
