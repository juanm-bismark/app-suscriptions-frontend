"use client"

import type { Control, FieldErrors, Path, PathValue, UseFormSetValue } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Company } from "@/lib/types/user"
import { CompanyPicker } from "./company-picker"

export type UserFormValues = {
  full_name?: string
  email: string
  password?: string
  role: "admin" | "manager" | "member" | "public"
  company_id?: string
}

const userInputClassName = "border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
const userSelectClassName = "mt-1 h-11 w-full rounded-md bg-white/80 px-3 text-sm text-title shadow-sm shadow-header-top/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"

export function UserFormAlerts({ error, success }: { error: string | null; success: string | null }) {
  return (
    <>
      {error && <div className="rounded-md bg-warn-bg p-3 text-sm text-warn-text">{error}</div>}
      {success && <div className="rounded-md bg-success-soft p-3 text-sm text-success-text-soft">{success}</div>}
    </>
  )
}

export function FullNameField<T extends UserFormValues>({ control }: { control: Control<T> }) {
  return (
    <FormField
      control={control}
      name={"full_name" as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre completo <span className="font-normal text-muted">(opcional)</span></FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} placeholder="Nombre del empleado" className={userInputClassName} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function EmailField<T extends UserFormValues>({
  control,
  placeholder,
}: {
  control: Control<T>
  placeholder: string
}) {
  return (
    <FormField
      control={control}
      name={"email" as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Correo electrónico</FormLabel>
          <FormControl>
            <Input {...field} type="email" placeholder={placeholder} className={userInputClassName} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PasswordField<T extends UserFormValues>({
  control,
  label,
  placeholder,
  showPassword,
  onTogglePassword,
  optional = false,
}: {
  control: Control<T>
  label: string
  placeholder: string
  showPassword: boolean
  onTogglePassword: () => void
  optional?: boolean
}) {
  return (
    <FormField
      control={control}
      name={"password" as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {optional && <span className="font-normal text-muted">(opcional)</span>}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                value={field.value ?? ""}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                className={`${userInputClassName} pr-11`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={onTogglePassword}
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
  )
}

export function AdminUserFields<T extends UserFormValues>({
  control,
  companies,
  errors,
  setValue,
}: {
  control: Control<T>
  companies: Company[]
  errors: FieldErrors<T>
  setValue: UseFormSetValue<T>
}) {
  const selectedCompanyId = useWatch({ control, name: "company_id" as Path<T> })

  return (
    <>
      <CompanyPicker
        companies={companies}
        value={typeof selectedCompanyId === "string" ? selectedCompanyId : ""}
        onChange={(id) => setValue("company_id" as Path<T>, id as PathValue<T, Path<T>>, { shouldValidate: true })}
        error={typeof errors.company_id?.message === "string" ? errors.company_id.message : undefined}
      />

      <FormField
        control={control}
        name={"role" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rol de acceso</FormLabel>
            <FormControl>
              <select {...field} className={userSelectClassName}>
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
    </>
  )
}
