import { z } from "zod"

const roleSchema = z.enum(["admin", "manager", "member", "public"], { error: "Rol inválido" })
const companySchema = z.string().trim().min(1, "Empresa inválida").or(z.literal("")).optional()
const fullNameSchema = z.string().min(2, "Mínimo 2 caracteres").or(z.literal("")).optional()

export const createUserSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres"),
  full_name: fullNameSchema,
  role: roleSchema,
  company_id: companySchema,
})

export const editUserSchema = z.object({
  full_name: fullNameSchema,
  email: z.email("Correo inválido"),
  password: z.union([
    z.string().min(6, "Contraseña de al menos 6 caracteres"),
    z.literal(""),
  ]).optional(),
  role: roleSchema,
  company_id: companySchema,
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type EditUserFormData = z.infer<typeof editUserSchema>
