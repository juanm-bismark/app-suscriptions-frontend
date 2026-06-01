"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Resolver, useForm, useWatch } from "react-hook-form"
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
import { dashboardStyles } from "../_components/dashboard-styles"
import { credentialDefaults, pruneEmptyStrings } from "./credential-payload"
import { providerName } from "./credential-utils"
import { environment, fieldsForProvider, fileToBase64, getPath, getSchema, userCredentialPayload } from "./form"

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
  const fields = useMemo(() => fieldsForProvider(provider, isAdmin), [provider, isAdmin])

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
      payload.credentials = userCredentialPayload(provider, creds)
      delete payload.account_scope
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
          className={dashboardStyles.softButton}
        >
          Probar
        </Button>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          loading={submittingMode === "save"}
          loadingText="Guardando..."
          className={dashboardStyles.primaryAction}
        >
          Guardar
        </Button>
        {isAdmin && credential?.active && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                disabled={form.formState.isSubmitting || deactivating}
                className="border-0 bg-white/80 text-warning-text-soft shadow-sm shadow-header-top/5 hover:bg-warning-soft hover:text-warning-hover-soft sm:ml-auto"
              >
                Desactivar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="gap-5">
              <AlertDialogHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning-soft text-warning-icon-soft">
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
              <div className="rounded-md border border-warning-border-soft bg-warning-soft px-3 py-2 text-sm font-medium text-warning-text-soft">
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
                  className="border-0 bg-warning-text-soft text-white shadow-sm hover:bg-warning-hover-soft"
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
