"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { updateUser } from "@/app/actions/users"
import { ROLES, type Company, type User, type UserRole } from "@/lib/types/user"
import { dashboardStyles } from "../_components/dashboard-styles"
import {
  AdminUserFields,
  EmailField,
  FullNameField,
  PasswordField,
  UserFormAlerts,
} from "./user-form-fields"
import { editUserSchema, type EditUserFormData } from "./user-form-schema"

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
      <UserFormAlerts error={error} success={success} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FullNameField control={form.control} />
          <EmailField control={form.control} placeholder="usuario@empresa.com" />
          <PasswordField
            control={form.control}
            label="Nueva contraseña"
            placeholder="Dejar vacío para no cambiar"
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((visible) => !visible)}
            optional
          />

          {currentRole === ROLES.ADMIN && (
            <AdminUserFields
              control={form.control}
              companies={companies}
              errors={form.formState.errors}
              setValue={form.setValue}
            />
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              loadingText="Guardando..."
              className={`flex-1 ${dashboardStyles.primaryAction}`}
            >
              Guardar cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
              className={dashboardStyles.softButton}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
