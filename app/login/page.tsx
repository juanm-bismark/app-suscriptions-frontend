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
            <h1 className="text-3xl font-bold text-title text-center mb-2">Inicia sesión</h1>
            <p className="text-center text-muted mb-8 text-sm">
              Accede a tu cuenta para gestionar tus suscripciones
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

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full mt-6 py-6 text-lg font-bold shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  {form.formState.isSubmitting ? "Iniciando..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center border-t border-border pt-6">
              <p className="text-muted text-sm mb-3">¿No tienes cuenta?</p>
              <Button asChild variant="ghost" className="w-full font-semibold">
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
