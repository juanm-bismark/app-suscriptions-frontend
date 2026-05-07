"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { registerUser } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
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
import { Logo } from "@/app/components/logo"

const registerSchema = z
  .object({
    email: z.email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    full_name: z
      .string()
      .refine((value) => value === "" || value.length >= 2, "Nombre requerido")
      .optional(),
    company_name: z.string().min(1, "El nombre de la empresa es requerido"),
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      company_name: "",
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)

    const result = await registerUser({
      email: data.email,
      password: data.password,
      company_name: data.company_name,
      full_name: data.full_name || undefined,
    })

    if ("error" in result) {
      setError(result.error)
    } else {
      router.push("/login?registered=1")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-header-top via-header-bg to-header-bg flex flex-col">
      {/* Header */}
      <div className="bg-header-bg border-b border-header-info-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo size="md" />
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-title text-center mb-2">Crear cuenta</h1>
            <p className="text-center text-muted mb-8 text-sm">
              Únete y comienza a gestionar tus suscripciones
            </p>

            {error && (
              <div className="bg-warn-bg border border-warn-border text-warn-text px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text">Correo</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@correo.com"
                          className="border-border bg-white text-text placeholder:text-muted"
                          {...field}
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
                      <FormLabel className="text-text">Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••"
                          className="border-border bg-white text-text placeholder:text-muted"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text">Nombre completo (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tu nombre"
                          className="border-border bg-white text-text placeholder:text-muted"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text">Nombre de la empresa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tu empresa"
                          className="border-border bg-white text-text placeholder:text-muted"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full mt-6 font-semibold"
                >
                  {form.formState.isSubmitting ? "Creando..." : "Crear cuenta"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center border-t border-border pt-6">
              <p className="text-muted text-sm mb-3">¿Ya tienes cuenta?</p>
              <Button asChild variant="ghost" className="w-full font-semibold">
                <Link href="/login">
                  Inicia sesión aquí
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
