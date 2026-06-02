"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { type Resolver, useForm, useWatch } from "react-hook-form"
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
  toast,
} from "@/components/ui"
import type { CredentialMetadataOut, CredentialUpsertIn, Provider } from "@/lib/types/api"
import { credentialDefaults, pruneEmptyStrings } from "./credential-payload"
import { providerName } from "./credential-utils"
import { CredentialActions } from "./form/credential-actions"
import { CredentialFieldGrid } from "./form/credential-fields"
import { fieldsForProvider, getSchema, KITE_DEFAULT_ENDPOINT, userCredentialPayload } from "./form"

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
    if (provider === "kite") {
      payload.credentials = {
        ...(payload.credentials ?? {}),
        endpoint: KITE_DEFAULT_ENDPOINT,
      }
    }
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

      <CredentialFieldGrid
        fields={fields}
        form={form}
        watchedValues={watchedValues}
        defaultValues={defaultValues}
      />

      {provider === "moabits" && !isAdmin && autoParentCompanyCode && (
        <div className="rounded-md border border-header-top/10 bg-white/40 px-3 py-2.5 text-sm">
          <span className="font-medium text-title">Código de empresa Moabits: </span>
          <span className="font-mono text-muted">{autoParentCompanyCode}</span>
        </div>
      )}

      <CredentialActions
        provider={provider}
        isAdmin={isAdmin}
        credentialActive={Boolean(credential?.active)}
        submitting={form.formState.isSubmitting}
        submittingMode={submittingMode}
        deactivating={deactivating}
        onTest={form.handleSubmit((values) => submit("test", values))}
        onDeactivate={() => void deactivate()}
      />

      <p className="text-xs text-muted">
        {providerName(provider)} valida las credenciales en backend antes de persistirlas.
      </p>
    </form>
  )
}
