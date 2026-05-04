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
import { updateProfile } from "@/app/actions/profile"

const profileSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres permitidos"),
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

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: initialName },
  })

  async function onSubmit(data: ProfileFormData) {
    setError(null)
    setSuccess(null)

    // We construct a FormData out of the react hook form values
    const fd = new FormData()
    fd.append("full_name", data.full_name)

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
          <div className="px-3 py-2 bg-page border border-border rounded-md text-sm text-muted cursor-not-allowed">
            {email}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Rol</label>
          <div className="px-3 py-2 bg-page border border-border rounded-md text-sm text-muted cursor-not-allowed uppercase">
            {role}
          </div>
        </div>
      </div>

      <hr className="border-border my-6" />

      {error && <div className="text-sm bg-warn-bg text-warn-text p-3 rounded-md">{error}</div>}
      {success && <div className="text-sm bg-green-100 text-green-800 p-3 rounded-md">{success}</div>}

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
                  <Input {...field} placeholder="Ingresa tu nombre completo" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
