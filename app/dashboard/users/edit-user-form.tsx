"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateUser } from "@/app/actions/users"
import { ROLES, type Company, type User, type UserRole } from "@/lib/types/user"
import { CompanyPicker } from "./company-picker"

const editUserSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres").or(z.literal("")).optional(),
  email: z.email("Correo inválido"),
  password: z.union([
    z.string().min(6, "Contraseña de al menos 6 caracteres"),
    z.literal(""),
  ]).optional(),
  role: z.enum(["admin", "manager", "member", "public"], { error: "Rol inválido" }),
  company_id: z.string().trim().min(1, "Empresa inválida").or(z.literal("")).optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

export function EditUserForm({
  user,
  currentRole,
  companies = [],
  onUpdated,
  onCancel,
}: {
  user: User
  currentRole: UserRole
  companies?: Company[]
  onUpdated?: (user: User) => void
  onCancel: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: user.full_name ?? "",
      email: user.email ?? "",
      password: "",
      role: user.role as "admin" | "manager" | "member" | "public",
      company_id: user.company_id ?? "",
    },
  })

  const selectedCompanyId = useWatch({ control: form.control, name: "company_id" })

  async function onSubmit(data: EditUserFormData) {
    setError(null)
    setSuccess(null)

    if (currentRole === ROLES.ADMIN && !data.company_id) {
      form.setError("company_id", { message: "Selecciona una empresa" })
      return
    }

    const fd = new FormData()
    fd.append("id", user.id)
    if (data.full_name) fd.append("full_name", data.full_name)
    fd.append("email", data.email)
    if (data.password) fd.append("password", data.password)
    if (currentRole === ROLES.ADMIN) {
      fd.append("role", data.role)
      if (data.company_id) fd.append("company_id", data.company_id)
    }

    const res = await updateUser(fd)
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      const updatedUser: User = {
        ...user,
        full_name: data.full_name?.trim() || null,
        email: data.email,
        role: currentRole === ROLES.ADMIN ? data.role : user.role,
        company_id: currentRole === ROLES.ADMIN ? data.company_id || null : user.company_id,
      }
      onUpdated?.(updatedUser)
      setSuccess(res.message || "Usuario actualizado")
      router.refresh()
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
                  <Input
                    {...field}
                    placeholder="Nombre del empleado"
                    className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                  />
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
                  <Input
                    {...field}
                    type="email"
                    placeholder="usuario@empresa.com"
                    className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                  />
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
                <FormLabel>
                  Nueva contraseña{" "}
                  <span className="font-normal text-muted">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Dejar vacío para no cambiar"
                      className="border-0 bg-white/80 pr-11 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((v) => !v)}
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

          <div className="flex gap-2">
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              loadingText="Guardando..."
              className="flex-1 bg-header-top text-white shadow-sm shadow-header-top/20 hover:bg-header-bg hover:text-white"
            >
              Guardar cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
              className="border-soft-border text-action-soft hover:bg-hover-soft hover:text-ink-teal"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
