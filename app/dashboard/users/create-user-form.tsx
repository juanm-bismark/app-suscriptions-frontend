"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { createUser } from "@/app/actions/users"
import { ROLES, type Company, type UserRole } from "@/lib/types/user"
import { dashboardStyles } from "../_components/dashboard-styles"
import {
  AdminUserFields,
  EmailField,
  FullNameField,
  PasswordField,
  UserFormAlerts,
} from "./user-form-fields"
import { createUserSchema, type CreateUserFormData } from "./user-form-schema"

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
      <UserFormAlerts error={error} success={success} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FullNameField control={form.control} />
          <EmailField control={form.control} placeholder="usuario@bismark.com" />
          <PasswordField
            control={form.control}
            label="Contraseña temporal"
            placeholder="••••••"
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((visible) => !visible)}
          />

          {currentRole === ROLES.ADMIN && (
            <AdminUserFields
              control={form.control}
              companies={companies}
              errors={form.formState.errors}
              setValue={form.setValue}
            />
          )}

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            loadingText="Añadiendo..."
            className={`w-full ${dashboardStyles.primaryAction}`}
          >
            Añadir usuario
          </Button>
        </form>
      </Form>
    </div>
  )
}
