"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
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

const createUserSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Contraseña de al menos 6 caracteres"),
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  role: z.enum(["admin", "manager", "member"], { error: "Rol inválido" }),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

export default function CreateUserForm({ currentRole }: { currentRole: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", password: "", full_name: "", role: "member" },
  })

  async function onSubmit(data: CreateUserFormData) {
    setError(null)
    setSuccess(null)

    const fd = new FormData()
    fd.append("email", data.email)
    fd.append("password", data.password)
    fd.append("full_name", data.full_name)
    fd.append("role", data.role)

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
      {success && <div className="text-sm bg-[#DDF4EA] text-[#16603B] p-3 rounded-md">{success}</div>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
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
                  <Input {...field} type="password" placeholder="••••••" className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol de acceso</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="mt-1 h-11 w-full rounded-md bg-white/80 px-3 text-sm text-title shadow-sm shadow-header-top/5 focus:outline-none focus:ring-2 focus:ring-header-accent"
                  >
                    <option value="member">Miembro (Visualizar e interactuar base)</option>
                    {currentRole === "admin" && (
                      <option value="manager">Manager (Añadir miembros y editar planes)</option>
                    )}
                    {currentRole === "admin" && (
                      <option value="admin">Administrador (Control total)</option>
                    )}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full bg-[#0E7490] text-white shadow-sm shadow-[#0E7490]/20 hover:bg-[#155E75] hover:text-white"
          >
            {form.formState.isSubmitting ? "Añadiendo..." : "Añadir usuario"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
