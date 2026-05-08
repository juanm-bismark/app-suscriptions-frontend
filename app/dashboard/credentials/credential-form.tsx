"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { type FieldPath, type Resolver, useForm } from "react-hook-form"
import { z } from "zod"
import { deactivateCredential, testCredential, upsertCredential } from "@/app/actions/credentials"
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
  Select,
  SelectItem,
  toast,
} from "@/components/ui"
import type { CredentialMetadataOut, CredentialUpsertIn, Provider } from "@/lib/types/api"
import { providerName } from "./credential-utils"

const environment = {
  production: "Produccion",
  staging: "Staging",
  sandbox: "Sandbox",
} as const

const kiteSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url("URL invalida").refine((u) => u.startsWith("https://"), "Debe ser HTTPS"),
    username: z.string().optional(),
    password: z.string().optional(),
    client_cert_pfx_b64: z.string().min(1, "Carga el certificado PFX"),
    client_cert_password: z.string().min(1, "Ingresa la clave del certificado"),
    server_ca_bundle_pem_b64: z.string().optional(),
  }).refine((v) => !!v.username === !!v.password, {
    message: "username y password de WS-Sec deben ir juntos",
    path: ["username"],
  }),
  account_scope: z.object({
    environment: z.enum(["production", "staging", "sandbox"]).default("production"),
    end_customer_id: z.string().optional(),
    cert_expires_at: z.string().datetime("Usa fecha ISO 8601").optional().or(z.literal("")),
  }),
})

const tele2Schema = z.object({
  credentials: z.object({
    cobrand_url: z.string().default("restapi3.jasper.com"),
    username: z.string().min(1, "Ingresa el usuario"),
    api_key: z.string().min(1, "Ingresa el API key"),
    api_version: z.literal("v1").default("v1"),
  }),
  account_scope: z.object({
    account_id: z.string().min(1, "Ingresa el account ID"),
    max_tps: z.coerce.number().int().min(1).max(50).default(5),
    environment: z.enum(["production", "staging"]).default("production"),
  }),
})

const moabitsSchema = z.object({
  credentials: z.object({
    base_url: z.string().url("URL invalida").default("https://www.api.myorion.co"),
    x_api_key: z.string().min(1, "Ingresa el x-api-key"),
    parent_company_code: z.string().min(1, "Ingresa el codigo de compania padre"),
  }),
  account_scope: z.object({
    parent_company_code: z.string().min(1, "Ingresa el codigo de compania padre"),
    environment: z.enum(["production", "staging"]).default("production"),
  }),
})

const SCHEMAS = {
  kite: kiteSchema,
  tele2: tele2Schema,
  moabits: moabitsSchema,
} as const

type Field =
  | { kind: "text" | "password" | "number"; name: FieldPath<CredentialUpsertIn>; label: string; placeholder?: string }
  | { kind: "select"; name: FieldPath<CredentialUpsertIn>; label: string; options: readonly (keyof typeof environment)[] }
  | { kind: "file"; name: FieldPath<CredentialUpsertIn>; label: string }

const FIELDS: Record<Provider, Field[]> = {
  kite: [
    { kind: "text", name: "credentials.endpoint", label: "Endpoint SOAP", placeholder: "https://..." },
    { kind: "text", name: "credentials.username", label: "WS-Sec username" },
    { kind: "password", name: "credentials.password", label: "WS-Sec password" },
    { kind: "file", name: "credentials.client_cert_pfx_b64", label: "Certificado cliente PFX" },
    { kind: "password", name: "credentials.client_cert_password", label: "Clave del certificado" },
    { kind: "text", name: "credentials.server_ca_bundle_pem_b64", label: "CA bundle PEM base64" },
    { kind: "select", name: "account_scope.environment", label: "Ambiente", options: ["production", "staging", "sandbox"] },
    { kind: "text", name: "account_scope.end_customer_id", label: "End customer ID" },
    { kind: "text", name: "account_scope.cert_expires_at", label: "Vencimiento certificado", placeholder: "2026-12-31T23:59:59Z" },
  ],
  tele2: [
    { kind: "text", name: "credentials.cobrand_url", label: "Cobrand URL" },
    { kind: "text", name: "credentials.username", label: "Usuario" },
    { kind: "password", name: "credentials.api_key", label: "API key" },
    { kind: "text", name: "credentials.api_version", label: "Version API" },
    { kind: "text", name: "account_scope.account_id", label: "Account ID" },
    { kind: "number", name: "account_scope.max_tps", label: "Max TPS" },
    { kind: "select", name: "account_scope.environment", label: "Ambiente", options: ["production", "staging"] },
  ],
  moabits: [
    { kind: "text", name: "credentials.base_url", label: "Base URL" },
    { kind: "password", name: "credentials.x_api_key", label: "x-api-key" },
    { kind: "text", name: "credentials.parent_company_code", label: "Codigo de compania padre" },
    { kind: "text", name: "account_scope.parent_company_code", label: "Scope compania padre" },
    { kind: "select", name: "account_scope.environment", label: "Ambiente", options: ["production", "staging"] },
  ],
}

function defaults(provider: Provider, credential?: CredentialMetadataOut | null): CredentialUpsertIn {
  const scope = credential?.account_scope ?? {}

  if (provider === "kite") {
    return {
      credentials: {
        endpoint: "",
        username: "",
        password: "",
        client_cert_pfx_b64: "",
        client_cert_password: "",
        server_ca_bundle_pem_b64: "",
      },
      account_scope: {
        environment: scope.environment ?? "production",
        end_customer_id: scope.end_customer_id ?? "",
        cert_expires_at: scope.cert_expires_at ?? "",
      },
    }
  }

  if (provider === "tele2") {
    return {
      credentials: {
        cobrand_url: "restapi3.jasper.com",
        username: "",
        api_key: "",
        api_version: "v1",
      },
      account_scope: {
        account_id: scope.account_id ?? "",
        max_tps: scope.max_tps ?? 5,
        environment: scope.environment ?? "production",
      },
    }
  }

  return {
    credentials: {
      base_url: "https://www.api.myorion.co",
      x_api_key: "",
      parent_company_code: String(scope.parent_company_code ?? ""),
    },
    account_scope: {
      parent_company_code: scope.parent_company_code ?? "",
      environment: scope.environment ?? "production",
    },
  }
}

function getPath(source: unknown, path: string) {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[part]
  }, source)
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer()
  let binary = ""
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i])
  return window.btoa(binary)
}

function pruneEmptyStrings(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pruneEmptyStrings)
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== "")
      .map(([key, item]) => [key, pruneEmptyStrings(item)])
  )
}

export function CredentialForm({
  provider,
  credential,
}: {
  provider: Provider
  credential?: CredentialMetadataOut | null
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const schema = SCHEMAS[provider]
  const defaultValues = useMemo(() => defaults(provider, credential), [provider, credential])

  const form = useForm<CredentialUpsertIn>({
    resolver: zodResolver(schema) as unknown as Resolver<CredentialUpsertIn>,
    defaultValues,
  })

  async function submit(mode: "test" | "save", values: CredentialUpsertIn) {
    setError(null)
    setSuccess(null)
    const payload = pruneEmptyStrings(values) as CredentialUpsertIn

    if (mode === "test") {
      const result = await testCredential(provider, payload)
      if (!result.ok) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      const message = result.data.detail || "Credenciales probadas correctamente"
      setSuccess(message)
      toast.success(message)
    } else {
      const result = await upsertCredential(provider, payload)
      if (!result.ok) {
        setError(result.error)
        toast.error(result.error)
        return
      }
      setSuccess("Credenciales guardadas correctamente")
      toast.success("Credenciales guardadas correctamente")
      router.refresh()
    }
  }

  async function deactivate() {
    setError(null)
    setSuccess(null)
    setDeactivating(true)
    const result = await deactivateCredential(provider)
    setDeactivating(false)

    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }

    setSuccess("Credencial desactivada correctamente")
    toast.success("Credencial desactivada correctamente")
    router.refresh()
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => submit("save", values))}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS[provider].map((field) => {
          const errorMessage = getPath(form.formState.errors, field.name)
          const value = getPath(form.getValues(), field.name)

          return (
            <label key={field.name} className="space-y-2 text-sm font-medium text-title">
              <span>{field.label}</span>
              {field.kind === "select" ? (
                <Select
                  {...form.register(field.name)}
                  className="h-11 border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                >
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {environment[option]}
                    </SelectItem>
                  ))}
                </Select>
              ) : field.kind === "file" ? (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".pfx,.p12,application/x-pkcs12"
                    className="border-0 bg-white/80 shadow-sm shadow-header-top/5 file:text-[#285F68] focus-visible:ring-header-accent"
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      form.setValue(field.name, await fileToBase64(file), { shouldDirty: true, shouldValidate: true })
                    }}
                  />
                  {value ? <p className="text-xs text-muted">Archivo cargado en base64.</p> : null}
                </div>
              ) : (
                <Input
                  {...form.register(field.name, field.kind === "number" ? { valueAsNumber: true } : undefined)}
                  type={field.kind === "password" ? "password" : field.kind === "number" ? "number" : "text"}
                  placeholder={field.placeholder}
                  className="border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
                />
              )}
              {errorMessage && typeof errorMessage === "object" && "message" in errorMessage ? (
                <p className="text-sm font-medium text-red-500">{String(errorMessage.message)}</p>
              ) : null}
            </label>
          )
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={form.formState.isSubmitting}
          onClick={form.handleSubmit((values) => submit("test", values))}
          className="border-0 bg-[#EAF6F7] text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-[#DDF1F2] hover:text-[#12343B]"
        >
          Probar credenciales
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting} className="bg-[#0F202A] text-white shadow-sm shadow-header-top/20 hover:bg-[#163C41] hover:text-white">
          Guardar
        </Button>
        {credential?.active && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={form.formState.isSubmitting || deactivating} className="border-0">
                Desactivar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desactivar credenciales</AlertDialogTitle>
                <AlertDialogDescription>
                  El proveedor quedara sin credenciales activas para sincronizacion y pruebas hasta que guardes unas nuevas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deactivating}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  disabled={deactivating}
                  onClick={() => void deactivate()}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-warn-bg px-4 py-2 text-sm font-medium text-warn-text transition-colors hover:bg-warn-bg/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {deactivating ? "Desactivando..." : "Desactivar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <p className="text-xs text-muted">
        {providerName(provider)} valida las credenciales en backend antes de persistirlas.
      </p>
    </form>
  )
}
