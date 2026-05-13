"use client"

import { useState } from "react"
import { testCompanyCredential } from "@/app/actions/credentials"
import { Button, toast } from "@/components/ui"
import type { CredentialMetadataOut, Provider } from "@/lib/types/api"
import { credentialTestPayload } from "./credential-payload"
import { providerName } from "./credential-utils"

export function TestCredentialButton({
  provider,
  companyId,
  credential,
}: {
  provider: Provider
  companyId: string
  credential: CredentialMetadataOut
}) {
  const [loading, setLoading] = useState(false)

  async function handleTest() {
    setLoading(true)
    try {
      const result = await testCompanyCredential(companyId, provider, credentialTestPayload(provider, credential))

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(result.data.detail || `Credenciales de ${providerName(provider)} probadas correctamente`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron probar las credenciales")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      loading={loading}
      loadingText="Probando..."
      title="Probar credencial"
      aria-label={`Probar credencial de ${providerName(provider)}`}
      onClick={() => void handleTest()}
      className="border-0 bg-[#EAF6F7] px-3 text-[#285F68] shadow-sm shadow-header-top/5 hover:bg-[#DDF1F2] hover:text-[#12343B]"
    >
      Probar
    </Button>
  )
}
