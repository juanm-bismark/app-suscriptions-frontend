"use client"

import { useState } from "react"
import { probeCompanyCredential, probeStoredCredential } from "@/app/actions/credentials"
import { Button, toast } from "@/components/ui"
import type { Provider } from "@/lib/types/api"
import { dashboardStyles } from "../_components/dashboard-styles"
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
      className={dashboardStyles.softButton}
    >
      Probar
    </Button>
  )
}
