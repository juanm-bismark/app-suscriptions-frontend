"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createUser } from "@/app/actions/users"
import { ROLES, type Company, type UserRole } from "@/lib/types/user"
import { CompanyPicker } from "./company-picker"

const createUserSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres"),
  full_name: z.string().min(2, "Mínimo 2 caracteres").or(z.literal("")).optional(),
  role: z.enum(["admin", "manager", "member", "public"], { error: "Rol inválido" }),
  company_id: z.string().trim().min(1, "Empresa inválida").or(z.literal("")).optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

export default function CreateUserForm({
  currentRole,
  companies = [],
}: {
  currentRole: UserRole
  companies?: Company[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", password: "", full_name: "", role: "member", company_id: "" },
  })

  const selectedCompanyId = useWatch({ control: form.control, name: "company_id" })

  async function onSubmit(data: CreateUserFormData) {
    setError(null)
    setSuccess(null)

    if (currentRole === ROLES.ADMIN && !data.company_id) {
      form.setError("company_id", { message: "Selecciona una empresa" })
      return
    }

    const fd = new FormData()
    fd.append("email", data.email)
    fd.append("password", data.password)
    if (data.full_name) fd.append("full_name", data.full_name)
    fd.append("role", data.role)
    if (data.company_id) fd.append("company_id", data.company_id)

    const res = await createUser(fd)
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSuccess(res.message || "Usuario creado")
      form.reset()
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm bg-warn-bg text-warn-text p-3 rounded-md">{error}</div>}
      {success && <div className="text-sm bg-success-soft text-success-text-soft p-3 rounded-md">{success}</div>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo <span className="font-normal text-muted">(opcional)</span></FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del empleado" className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="usuario@bismark.com" className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña temporal</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      className="border-0 bg-white/80 pr-11 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted transition-colors hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {currentRole === ROLES.ADMIN && (
            <CompanyPicker
              companies={companies}
              value={selectedCompanyId ?? ""}
              onChange={(id) => form.setValue("company_id", id, { shouldValidate: true })}
              error={form.formState.errors.company_id?.message}
            />
          )}

          {currentRole === ROLES.ADMIN && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol de acceso</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="mt-1 h-11 w-full rounded-md bg-white/80 px-3 text-sm text-title shadow-sm shadow-header-top/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
                    >
                      <option value="member">Miembro (Visualizar e interactuar base)</option>
                      <option value="manager">Manager (Añadir miembros)</option>
                      <option value="admin">Administrador (Control total)</option>
                      <option value="public">Público (Sin empresa asignada)</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            loadingText="Añadiendo..."
            className="w-full bg-action-teal text-white shadow-sm shadow-[#0E7490]/20 hover:bg-action-teal-hover hover:text-white"
          >
            Añadir usuario
          </Button>
        </form>
      </Form>
    </div>
  )
}
