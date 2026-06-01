"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { updateProfile } from "@/app/actions/profile"

const profileSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres permitidos"),
  password: z.union([
    z.string().min(6, "Contraseña de al menos 6 caracteres"),
    z.literal(""),
  ]).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileForm({
  initialName, email, role
}: {
  initialName: string,
  email: string,
  role: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: initialName, password: "" },
  })

  async function onSubmit(data: ProfileFormData) {
    setError(null)
    setSuccess(null)

    const fd = new FormData()
    fd.append("full_name", data.full_name)
    if (data.password) fd.append("password", data.password)

    const res = await updateProfile(fd)
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSuccess(res.message || "Guardado")
    }
  }

  return (
    <div className="space-y-6">
      {/* Read-only fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Correo electrónico</label>
          <div className="min-h-11 px-3 py-2.5 bg-white/55 rounded-md text-sm text-muted cursor-not-allowed shadow-sm shadow-header-top/5">
            {email}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Rol</label>
          <div className="min-h-11 px-3 py-2.5 bg-white/55 rounded-md text-sm text-muted cursor-not-allowed uppercase shadow-sm shadow-header-top/5">
            {role}
          </div>
        </div>
      </div>

      {error && <div className="text-sm bg-warn-bg text-warn-text p-3 rounded-md">{error}</div>}
      {success && <div className="text-sm bg-success-soft text-success-text-soft p-3 rounded-md">{success}</div>}

      {/* Editable fields */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ingresa tu nombre completo" className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent" />
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
                <FormLabel>Nueva contraseña <span className="text-muted font-normal">(opcional)</span></FormLabel>
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
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            loadingText="Guardando..."
            className="bg-header-top text-white shadow-sm shadow-header-top/20 hover:bg-header-bg hover:text-white"
          >
            Guardar cambios
          </Button>
        </form>
      </Form>
    </div>
  )
}
