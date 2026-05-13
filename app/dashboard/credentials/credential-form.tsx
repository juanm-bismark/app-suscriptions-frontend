"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { type FieldPath, type Resolver, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { AlertTriangle } from "lucide-react"
import {
  deactivateCompanyCredential,
  deactivateCredential,
  testCompanyCredential,
  testCredential,
  upsertCompanyCredential,
  upsertCredential,
} from "@/app/actions/credentials"
import {
  Alert,
  AlertDescription,
  AlertDialog,
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
import { credentialDefaults, pruneEmptyStrings } from "./credential-payload"
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
    client_cert_pfx_b64: z.string().optional(),
    client_cert_password: z.string().optional(),
    server_ca_bundle_pem_b64: z.string().optional(),
  }).refine((v) => !!v.username === !!v.password, {
    message: "username y password de WS-Sec deben ir juntos",
    path: ["username"],
  }).refine((v) => !v.client_cert_pfx_b64 || !!v.client_cert_password, {
    message: "Ingresa la clave del certificado",
    path: ["client_cert_password"],
  }),
  account_scope: z.object({
    environment: z.enum(["production", "staging", "sandbox"]).default("production"),
    end_customer_id: z.string().optional(),
  }),
})

const tele2Schema = z.object({
  credentials: z.object({
    cobrand_url: z.string().default("restapi3.jasper.com"),
    username: z.string().min(1, "Ingresa el usuario"),
    api_key: z.string().min(1, "Ingresa el API key"),
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
  }),
  account_scope: z.object({
    parent_company_code: z.string().min(1, "Ingresa el codigo de compania padre"),
    environment: z.enum(["production", "staging"]).default("production"),
  }),
})

const moabitsUserSchema = z.object({
  credentials: z.object({
    x_api_key: z.string().min(1, "Ingresa el x-api-key"),
  }),
  account_scope: z.record(z.string(), z.unknown()).default({}),
})

const tele2UserSchema = z.object({
  credentials: z.object({
    api_key: z.string().min(1, "Ingresa el API key"),
  }),
  account_scope: z.record(z.string(), z.unknown()).default({}),
})

const kiteUserSchema = z.object({
  credentials: z.object({
    client_cert_pfx_b64: z.string().min(1, "Carga el certificado PFX"),
    client_cert_password: z.string().min(1, "Ingresa la clave del certificado"),
  }),
  account_scope: z.record(z.string(), z.unknown()).default({}),
})

const SCHEMAS = {
  kite: kiteSchema,
  tele2: tele2Schema,
  moabits: moabitsSchema,
} as const

function getSchema(provider: Provider, isAdmin: boolean) {
  if (!isAdmin && provider === "moabits") return moabitsUserSchema
  if (!isAdmin && provider === "tele2") return tele2UserSchema
  if (!isAdmin && provider === "kite") return kiteUserSchema
  return SCHEMAS[provider]
}

type Field =
  | { kind: "text" | "password" | "number"; name: FieldPath<CredentialUpsertIn>; label: string; placeholder?: string; adminOnly?: boolean }
  | { kind: "select"; name: FieldPath<CredentialUpsertIn>; label: string; options: readonly (keyof typeof environment)[]; adminOnly?: boolean }
  | { kind: "file"; name: FieldPath<CredentialUpsertIn>; label: string; adminOnly?: boolean }

const FIELDS: Record<Provider, Field[]> = {
  kite: [
    { kind: "text", name: "credentials.endpoint", label: "Endpoint SOAP", placeholder: "https://...", adminOnly: true },
    { kind: "text", name: "credentials.username", label: "WS-Sec username", adminOnly: true },
    { kind: "password", name: "credentials.password", label: "WS-Sec password", adminOnly: true },
    { kind: "file", name: "credentials.client_cert_pfx_b64", label: "Certificado cliente PFX" },
    { kind: "password", name: "credentials.client_cert_password", label: "Clave del certificado" },
    { kind: "text", name: "credentials.server_ca_bundle_pem_b64", label: "CA bundle PEM base64", adminOnly: true },
    { kind: "select", name: "account_scope.environment", label: "Ambiente", options: ["production", "staging", "sandbox"], adminOnly: true },
    { kind: "text", name: "account_scope.end_customer_id", label: "End customer ID", adminOnly: true },
  ],
  tele2: [
    { kind: "text", name: "credentials.cobrand_url", label: "Cobrand URL", adminOnly: true },
    { kind: "text", name: "credentials.username", label: "Usuario", adminOnly: true },
    { kind: "password", name: "credentials.api_key", label: "API key" },
    { kind: "text", name: "account_scope.account_id", label: "Account ID", adminOnly: true },
    { kind: "number", name: "account_scope.max_tps", label: "Max TPS", adminOnly: true },
    { kind: "select", name: "account_scope.environment", label: "Ambiente", options: ["production", "staging"], adminOnly: true },
  ],
  moabits: [
    { kind: "text", name: "credentials.base_url", label: "Base URL", adminOnly: true },
    { kind: "password", name: "credentials.x_api_key", label: "x-api-key" },
    { kind: "text", name: "account_scope.parent_company_code", label: "Codigo de compania padre", adminOnly: true },
    { kind: "select", name: "account_scope.environment", label: "Ambiente", options: ["production", "staging"], adminOnly: true },
  ],
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

function alignCredentialPayload(provider: Provider, payload: CredentialUpsertIn) {
  if (provider !== "moabits") return
  const scope = payload.account_scope
  const parentCompanyCode = scope?.parent_company_code
  if (!parentCompanyCode) return

  payload.credentials = {
    ...(payload.credentials ?? {}),
    parent_company_code: parentCompanyCode,
  }
}

export function CredentialForm({
  provider,
  credential,
  isAdmin = true,
  companyId,
  autoParentCompanyCode,
  onSuccess,
}: {
  provider: Provider
  credential?: CredentialMetadataOut | null
  isAdmin?: boolean
  companyId?: string
  autoParentCompanyCode?: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submittingMode, setSubmittingMode] = useState<"test" | "save" | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const schema = getSchema(provider, isAdmin)
  const defaultValues = useMemo(() => credentialDefaults(provider, credential), [provider, credential])
  const fields = useMemo(
    () => FIELDS[provider].filter((field) => isAdmin || !field.adminOnly),
    [provider, isAdmin]
  )

  const form = useForm<CredentialUpsertIn>({
    resolver: zodResolver(schema) as unknown as Resolver<CredentialUpsertIn>,
    defaultValues,
  })
  const watchedValues = useWatch({ control: form.control })

  async function submit(mode: "test" | "save", values: CredentialUpsertIn) {
    setError(null)
    setSuccess(null)
    setSubmittingMode(mode)
    const payload = pruneEmptyStrings(values) as CredentialUpsertIn
    if (!isAdmin) {
      const creds = payload.credentials as Record<string, unknown>
      if (provider === "tele2") {
        payload.credentials = { api_key: creds.api_key }
      } else if (provider === "moabits") {
        payload.credentials = { x_api_key: creds.x_api_key }
      } else if (provider === "kite") {
        payload.credentials = {
          client_cert_pfx_b64: creds.client_cert_pfx_b64,
          client_cert_password: creds.client_cert_password,
        }
      }
      delete payload.account_scope
    } else {
      alignCredentialPayload(provider, payload)
    }

    try {
      if (mode === "test") {
        const result = companyId
          ? await testCompanyCredential(companyId, provider, payload)
          : await testCredential(provider, payload)
        if (!result.ok) {
          setError(result.error)
          toast.error(result.error)
          return
        }
        const message = result.data.detail || "Credenciales probadas correctamente"
        setSuccess(message)
        toast.success(message)
      } else {
        const result = companyId
          ? await upsertCompanyCredential(companyId, provider, payload)
          : await upsertCredential(provider, payload)
        if (!result.ok) {
          setError(result.error)
          toast.error(result.error)
          return
        }
        setSuccess("Credenciales guardadas correctamente")
        toast.success("Credenciales guardadas correctamente")
        router.refresh()
        onSuccess?.()
      }
    } finally {
      setSubmittingMode(null)
    }
  }

  async function deactivate() {
    setError(null)
    setSuccess(null)
    setDeactivating(true)
    try {
      const result = companyId
        ? await deactivateCompanyCredential(companyId, provider)
        : await deactivateCredential(provider)

      if (!result.ok) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      setSuccess("Credencial desactivada correctamente")
      toast.success("Credencial desactivada correctamente")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo desactivar la credencial"
      setError(message)
      toast.error(message)
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((values) => submit("save", values))}>
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

      <div className="rounded-lg bg-white/30 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => {
            const errorMessage = getPath(form.formState.errors, field.name)
            const value = getPath(watchedValues, field.name) ?? getPath(defaultValues, field.name)

            return (
              <label key={field.name} className="space-y-1.5 text-sm font-medium text-title">
                <span>{field.label}</span>
                {field.kind === "select" ? (
                  <Select
                    {...form.register(field.name)}
                    value={String(value ?? "")}
                    className="h-10 border-0 bg-white/80 shadow-sm shadow-header-top/5 focus-visible:ring-header-accent"
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
                      className="border-0 bg-white/80 shadow-sm shadow-header-top/5 file:text-header-bg focus-visible:ring-header-accent"
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
      </div>

      {provider === "moabits" && !isAdmin && autoParentCompanyCode && (
        <div className="rounded-md border border-header-top/10 bg-white/40 px-3 py-2.5 text-sm">
          <span className="font-medium text-title">Código de empresa Moabits: </span>
          <span className="font-mono text-muted">{autoParentCompanyCode}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-header-top/10">
        <Button
          type="button"
          disabled={form.formState.isSubmitting}
          loading={submittingMode === "test"}
          loadingText="Probando..."
          onClick={form.handleSubmit((values) => submit("test", values))}
          className="border-0 bg-white/80 text-header-bg shadow-sm shadow-header-top/10 hover:bg-white hover:text-header-top"
        >
          Probar
        </Button>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          loading={submittingMode === "save"}
          loadingText="Guardando..."
          className="border-0 bg-[#060D13] text-white shadow-sm shadow-black/30 hover:bg-[#0A1520]"
        >
          Guardar
        </Button>
        {isAdmin && credential?.active && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                disabled={form.formState.isSubmitting || deactivating}
                className="border-0 bg-white/80 text-[#6D4D16] shadow-sm shadow-header-top/5 hover:bg-[#FFF7E7] hover:text-[#4A3010] sm:ml-auto"
              >
                Desactivar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="gap-5">
              <AlertDialogHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#FFF7E7] text-[#765315]">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <AlertDialogTitle>Desactivar credenciales</AlertDialogTitle>
                    <AlertDialogDescription className="mt-1">
                      {providerName(provider)} quedara sin credenciales activas para sincronizacion y pruebas hasta que guardes unas nuevas.
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>
              <div className="rounded-md border border-[#F2D49B] bg-[#FFF7E7] px-3 py-2 text-sm font-medium text-[#6D4D16]">
                Esta accion no elimina datos historicos, pero detiene el uso de estas credenciales.
              </div>
              <AlertDialogFooter className="pt-1">
                <AlertDialogCancel disabled={deactivating}>Mantener activas</AlertDialogCancel>
                <Button
                  type="button"
                  disabled={deactivating}
                  loading={deactivating}
                  loadingText="Desactivando..."
                  onClick={() => void deactivate()}
                  className="border-0 bg-[#6D4D16] text-white shadow-sm hover:bg-[#4A3010]"
                >
                  Desactivar
                </Button>
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
