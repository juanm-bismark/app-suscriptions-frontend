"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { registerUser } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "next-auth/react"
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

const registerSchema = z
  .object({
    name: z.string().optional(),
    company_name: z.string().min(1, "El nombre de la empresa es requerido"),
    email: z.email("Correo inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      company_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)

    const result = await registerUser({
      email: data.email,
      password: data.password,
      company_name: data.company_name,
      name: data.name || undefined,
    })

    if ("error" in result) {
      setError(result.error)
    } else {
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text">Nombre (opcional)</FormLabel>
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text">Confirmar contraseña</FormLabel>
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
                  {form.formState.isSubmitting ? "Creando..." : "Crear cuenta"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center border-t border-border pt-6">
              <p className="text-muted text-sm mb-3">¿Ya tienes cuenta?</p>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-header-accent hover:bg-page">
                  Inicia sesión aquí
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
