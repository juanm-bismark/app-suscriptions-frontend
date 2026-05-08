"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
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

const loginSchema = z.object({
  email: z.string().min(1, "Correo requerido"),
  password: z.string().min(1, "Contraseña requerida"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      const errorByCode: Record<string, string> = {
        invalid_credentials: "Credenciales inválidas",
        credentials: "Credenciales inválidas",
      }

      setError(
        result.code && errorByCode[result.code]
          ? errorByCode[result.code]
          : result.error && result.error !== "CredentialsSignin"
            ? result.error
            : "Credenciales inválidas"
      )
    } else if (result?.ok) {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-header-top via-header-bg to-header-bg">
      {/* Header */}
      <div className="bg-header-bg/95 shadow-sm shadow-black/10 ring-1 ring-white/5 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo size="md" />
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-card p-6 shadow-lg shadow-header-top/15 ring-1 ring-white/30 sm:p-8">
            <div className="mx-auto mb-6 h-1 w-14 rounded-full bg-header-accent" />
            <h1 className="text-center text-3xl font-bold text-title">Inicia sesión</h1>
            <p className="mb-8 mt-2 text-center text-sm text-muted">
              Accede a tu cuenta para gestionar tus suscripciones
            </p>

            {error && (
              <div className="mb-6 rounded-md bg-warn-bg px-4 py-3 text-sm font-medium text-warn-text shadow-sm">
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
                          className="h-11 border-border bg-white text-text shadow-sm placeholder:text-muted focus-visible:ring-header-accent"
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
                          className="h-11 border-border bg-white text-text shadow-sm placeholder:text-muted focus-visible:ring-header-accent"
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
                  className="mt-6 h-12 w-full bg-[#12343B] text-base font-bold text-white shadow-md shadow-header-top/15 transition-all duration-200 hover:bg-[#1A4A52] hover:text-white hover:shadow-lg focus-visible:ring-header-accent"
                >
                  {form.formState.isSubmitting ? "Iniciando..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center">
              <p className="mb-3 text-sm text-muted">¿No tienes cuenta?</p>
              <Button asChild variant="secondary" className="h-10 w-full bg-[#1A4A52] font-semibold text-white shadow-sm shadow-header-top/10 hover:bg-[#235D66] hover:text-white">
                <Link href="/register">
                  Crear cuenta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
