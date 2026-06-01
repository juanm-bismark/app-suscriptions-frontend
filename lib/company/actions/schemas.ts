import { z } from "zod"

const companyNameSchema = z.string().trim().min(2, "El nombre de la empresa debe tener al menos 2 caracteres")

export const createCompanySchema = z.object({
  name: companyNameSchema,
})

export const updateCompanySchema = z.object({
  id: z.string().uuid("Empresa inválida"),
  name: companyNameSchema,
})

export const deleteCompanySchema = z.object({
  id: z.string().uuid("Empresa inválida"),
})

