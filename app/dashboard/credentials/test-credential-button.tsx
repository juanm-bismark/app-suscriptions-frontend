"use client"

import { useState } from "react"
import { probeCompanyCredential, probeStoredCredential } from "@/app/actions/credentials"
import { Button, toast } from "@/components/ui"
import type { Provider } from "@/lib/types/api"
import { providerName } from "./credential-utils"

export function TestCredentialButton({ provider, companyId }: { provider: Provider; companyId?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleTest() {
    setLoading(true)
    try {
      if (companyId) {
        const result = await probeCompanyCredential(companyId, provider)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success(`${providerName(provider)}: credencial probada correctamente`)
        return
      }

      const result = await probeStoredCredential(provider)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`${providerName(provider)}: ${result.data.detail}`)
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
