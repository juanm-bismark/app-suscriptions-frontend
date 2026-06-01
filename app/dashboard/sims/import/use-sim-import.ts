"use client"

import { type FormEvent, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { importSims } from "@/app/actions/sims"
import { PROVIDER_IDS } from "@/lib/provider-meta"
import { parseSimsCsv } from "@/lib/sims/import-csv"
import type { Provider } from "@/lib/types/api"

const PROVIDERS: Provider[] = PROVIDER_IDS

export function useSimImport(activeProviders: Provider[]) {
  const queryClient = useQueryClient()
  const [fileName, setFileName] = useState("")
  const [csv, setCsv] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const parsed = useMemo(() => parseSimsCsv(csv, activeProviders), [activeProviders, csv])
  const providerCounts = useMemo(
    () =>
      activeProviders.map((provider) => ({
        provider,
        count: parsed.rows.filter((row) => row.provider === provider).length,
      })),
    [activeProviders, parsed.rows],
  )
  const exampleProviders = activeProviders.length > 0 ? activeProviders : PROVIDERS
  const exampleCsv = ["iccid,provider", ...exampleProviders.map((provider, index) => `895730000000000000${index + 1},${provider}`)].join("\n")
  const ready = activeProviders.length > 0 && csv.length > 0 && parsed.rows.length > 0 && parsed.errors.length === 0

  async function onFileSelected(file: File | undefined) {
    setError(null)
    setSuccess(null)
    setFileName(file?.name ?? "")

    if (!file) {
      setCsv("")
      return
    }

    if (file.type && file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setCsv("")
      setError("Selecciona un archivo CSV.")
      return
    }

    setCsv(await file.text())
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (activeProviders.length === 0) {
      setError("Configura al menos una credencial activa antes de importar SIMs.")
      return
    }

    if (parsed.errors.length > 0) {
      setError("Corrige los errores del CSV antes de importar.")
      return
    }

    setSubmitting(true)
    const result = await importSims({ sims: parsed.rows })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
    setSuccess(`${result.data.imported} SIM${result.data.imported === 1 ? "" : "s"} importada${result.data.imported === 1 ? "" : "s"} correctamente.`)
  }

  return {
    error,
    exampleCsv,
    fileName,
    onFileSelected,
    onSubmit,
    parsed,
    providerCounts,
    ready,
    submitting,
    success,
  }
}

