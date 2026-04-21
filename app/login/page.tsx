"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
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

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
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
      setError("Correo o contraseña inválidos")
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
            <Image
              src="https://bismark.net.co/wp-content/uploads/2020/02/bismark-logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-header-text font-semibold hidden sm:block">App Suscripciones</span>
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
                  className="w-full mt-6 bg-header-accent hover:bg-header-accent/90 text-white font-medium"
                >
                  {form.formState.isSubmitting ? "Iniciando..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center border-t border-border pt-6">
              <p className="text-muted text-sm mb-3">¿No tienes cuenta?</p>
              <Link href="/register">
                <Button variant="ghost" className="w-full text-header-accent hover:bg-page">
                  Crear cuenta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
