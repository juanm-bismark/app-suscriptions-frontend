"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { importSims } from "@/app/actions/sims"
import { Alert, AlertDescription, AlertTitle, Button, Card, Progress } from "@/components/ui"
import type { Provider, SimImportIn } from "@/lib/types/api"
import { SourceBadge } from "@/app/dashboard/subscriptions/primitives"

const PROVIDERS: Provider[] = ["kite", "tele2", "moabits"]

type ParsedRow = SimImportIn["sims"][number]
type ParseResult = {
  rows: ParsedRow[]
  errors: string[]
}

function isProvider(value: string): value is Provider {
  return PROVIDERS.includes(value as Provider)
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    const next = line[i + 1]

    if (ch === '"' && quoted && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (ch === '"') {
      quoted = !quoted
      continue
    }

    if (ch === "," && !quoted) {
      cells.push(current.trim())
      current = ""
      continue
    }

    current += ch
  }

  cells.push(current.trim())
  return cells
}

function parseSimsCsv(text: string): ParseResult {
  const rows: ParsedRow[] = []
  const errors: string[] = []
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/)
  let sawHeader = false

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()
    const lineNumber = index + 1
    if (!line) return

    const cells = parseCsvLine(line)
    const [iccidRaw, providerRaw] = cells
    const iccid = iccidRaw?.trim()
    const provider = providerRaw?.trim().toLowerCase()

    if (!sawHeader && lineNumber === 1 && iccid?.toLowerCase() === "iccid" && provider === "provider") {
      sawHeader = true
      return
    }

    if (cells.length !== 2) {
      errors.push(`Linea ${lineNumber}: usa exactamente dos columnas: iccid,provider.`)
      return
    }

    if (!iccid) {
      errors.push(`Linea ${lineNumber}: ICCID es obligatorio.`)
      return
    }

    if (!provider || !isProvider(provider)) {
      errors.push(`Linea ${lineNumber}: proveedor invalido (${providerRaw || "vacio"}).`)
      return
    }

    rows.push({ iccid, provider })
  })

  if (rows.length === 0 && errors.length === 0) {
    errors.push("El CSV no tiene filas para importar.")
  }

  return { rows, errors }
}

export function SimImportForm() {
  const [fileName, setFileName] = useState("")
  const [csv, setCsv] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const parsed = useMemo(() => parseSimsCsv(csv), [csv])
  const providerCounts = useMemo(
    () =>
      PROVIDERS.map((provider) => ({
        provider,
        count: parsed.rows.filter((row) => row.provider === provider).length,
      })),
    [parsed.rows]
  )

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

    setSuccess(`${result.data.imported} SIM${result.data.imported === 1 ? "" : "s"} importada${result.data.imported === 1 ? "" : "s"} correctamente.`)
  }

  const ready = csv.length > 0 && parsed.rows.length > 0 && parsed.errors.length === 0

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Bootstrap de rutas</p>
          <h1 className="mt-2 text-3xl font-bold text-title">Importar SIMs</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Carga el mapa inicial de ICCID y proveedor para habilitar el listado global de suscripciones.
          </p>
        </div>
        <Link className="text-sm font-semibold text-header-bg hover:underline" href="/dashboard/subscriptions">
          Volver a suscripciones
        </Link>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="p-5">
          <label className="block">
            <span className="text-sm font-semibold text-title">Archivo CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void onFileSelected(event.target.files?.[0])}
              className="mt-3 block w-full rounded border border-border bg-page px-3 py-2 text-sm text-title file:mr-4 file:rounded file:border-0 file:bg-header-bg file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>

          <div className="mt-5 rounded border border-dashed border-border bg-page p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Formato esperado</div>
            <pre className="mt-3 overflow-x-auto rounded bg-card p-3 text-xs text-title">{`iccid,provider
8957300000000000001,kite
8957300000000000002,tele2
8957300000000000003,moabits`}</pre>
          </div>

          {csv && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-title">{fileName || "CSV seleccionado"}</span>
                <span className="text-muted">{parsed.rows.length} fila{parsed.rows.length === 1 ? "" : "s"} valida{parsed.rows.length === 1 ? "" : "s"}</span>
              </div>
              <Progress value={parsed.errors.length > 0 ? 35 : 100} />
            </div>
          )}

          {parsed.errors.length > 0 && (
            <Alert className="mt-5" variant="destructive">
              <AlertTitle>No se puede importar todavia</AlertTitle>
              <AlertDescription>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {parsed.errors.slice(0, 8).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {parsed.errors.length > 8 && <p className="mt-2">Hay {parsed.errors.length - 8} errores adicionales.</p>}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mt-5" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mt-5" variant="success">
              <AlertDescription>
                {success}
              <div className="mt-2">
                <Link className="font-semibold underline" href="/dashboard/subscriptions">
                  Ver listado global
                </Link>
              </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button type="submit" disabled={!ready || submitting}>
              {submitting ? "Importando..." : "Importar SIMs"}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-title">Revision</h2>
          <p className="mt-1 text-sm text-muted">Solo se aceptan proveedores soportados por el API.</p>

          <div className="mt-5 space-y-3">
            {providerCounts.map(({ provider, count }) => (
              <div key={provider} className="flex items-center justify-between gap-3 rounded border border-border bg-page px-3 py-2">
                <SourceBadge source={provider} withName />
                <span className="font-mono text-sm font-semibold text-title">{count}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-border bg-page p-4 text-sm text-muted">
            <p className="font-semibold text-title">Reglas</p>
            <p className="mt-2">Cada fila debe tener ICCID no vacio y proveedor en kite, tele2 o moabits.</p>
          </div>
        </Card>
      </form>
    </main>
  )
}
