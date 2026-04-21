"use server"

import { z } from "zod"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const registerSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  company_name: z.string().min(1, "Empresa requerida"),
  name: z.string().optional(),
})

export async function registerUser(
  data: z.infer<typeof registerSchema>
) {
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error: "Datos inválidos",
    }
  }

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        company_name: parsed.data.company_name,
        name: parsed.data.name || null,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        error: error.message || "Error al registrar",
      }
    }

    const user = await response.json()
    return {
      success: true,
      userId: user.id,
    }
  } catch (error) {
    return {
      error: "Error de conexión con el servidor",
    }
  }
}
