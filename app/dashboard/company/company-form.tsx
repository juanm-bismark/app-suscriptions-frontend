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
import { updateCompany } from "@/app/actions/company"

const companySchema = z.object({
  name: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompanyForm({
  initialName,
  canEdit,
}: {
  initialName: string
  canEdit: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: initialName },
  })

  async function onSubmit(data: CompanyFormData) {
    if (!canEdit) return

    setError(null)
    setSuccess(null)

    const fd = new FormData()
    fd.append("name", data.name)

    const res = await updateCompany(fd)
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSuccess(res.message || "Empresa guardada")
    }
  }

  return (
    <div className="space-y-6">

      {error && <div className="text-sm bg-warn-bg text-warn-text p-3 rounded-md">{error}</div>}
      {success && <div className="text-sm bg-[#DDF4EA] text-[#16603B] p-3 rounded-md">{success}</div>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Empresa</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly={!canEdit}
                    placeholder="Ej. Bismark"
                    className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent read-only:text-muted"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {canEdit && (
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="bg-[#0F202A] text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41] hover:text-white"
            >
              {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          )}
        </form>
      </Form>
    </div>
  )
}
