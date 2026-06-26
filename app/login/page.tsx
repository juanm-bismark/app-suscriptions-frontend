"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { CircleAlert, Eye, EyeOff } from "lucide-react"
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
type LoginError = {
  title: string
  description: string
}

const loginErrorByCode: Record<string, LoginError> = {
  auth_service_unavailable: {
    title: "No se pudo conectar con el servidor",
    description: "Verifica que el backend esté corriendo e intenta de nuevo.",
  },
  invalid_credentials: {
    title: "Credenciales inválidas",
    description: "Revisa el correo y la contraseña e intenta de nuevo.",
  },
  credentials: {
    title: "Credenciales inválidas",
    description: "Revisa el correo y la contraseña e intenta de nuevo.",
  },
}

const defaultLoginError: LoginError = {
  title: "Credenciales inválidas",
  description: "Revisa el correo y la contraseña e intenta de nuevo.",
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<LoginError | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
      setError(result.code && loginErrorByCode[result.code] ? loginErrorByCode[result.code] : defaultLoginError)
    } else if (result?.ok) {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-accent-soft via-nav-soft to-badge-bg">
      {/* Header */}
      <div className="bg-nav-soft/55 shadow-sm shadow-nav-shadow/5 ring-1 ring-white/35 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo size="md" priority />
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-card/92 p-6 shadow-lg shadow-nav-shadow/10 ring-1 ring-white/70 backdrop-blur-sm sm:p-8">
            <div className="mx-auto mb-6 h-1 w-14 rounded-full bg-header-accent" />
            <h1 className="text-center text-3xl font-bold text-title">Inicia sesión</h1>
            <p className="mb-8 mt-2 text-center text-sm text-muted">
              Accede a tu cuenta para gestionar tus suscripciones
            </p>

            {error && (
              <div role="alert" className="mb-6 flex items-center gap-3 rounded-lg border border-danger-action/20 bg-danger-tint px-4 py-3 text-left shadow-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-danger-action">
                  <CircleAlert className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-5 text-danger-strong-text">{error.title}</p>
                  <p className="mt-1 text-sm leading-5 text-danger-text-soft">{error.description}</p>
                </div>
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
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            className="h-11 border-border bg-white pr-12 text-text shadow-sm placeholder:text-muted focus-visible:ring-header-accent"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover-soft hover:text-title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent focus-visible:ring-offset-2"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  loading={form.formState.isSubmitting}
                  loadingText="Iniciando..."
                  className="mt-6 h-12 w-full bg-nav-avatar text-base font-bold text-white shadow-md shadow-nav-shadow/20 transition-all duration-200 hover:bg-nav-button-text hover:text-white hover:shadow-lg focus-visible:ring-header-accent"
                >
                  Iniciar sesión
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center">
              <p className="mb-3 text-sm text-muted">¿No tienes cuenta?</p>
              <Button asChild variant="secondary" className="h-10 w-full border border-white/70 bg-nav-button-soft/75 font-semibold text-nav-button-text shadow-sm shadow-nav-shadow/10 hover:bg-hover-soft hover:text-nav-button-hover">
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
