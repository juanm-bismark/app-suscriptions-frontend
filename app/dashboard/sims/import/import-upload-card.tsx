"use client"

import Link from "next/link"
import { Alert, AlertDescription, AlertTitle, Button, Card, Progress } from "@/components/ui"
import type { SimImportParseResult } from "@/lib/sims/import-csv"

export function SimImportUploadCard({
  activeProvidersCount,
  error,
  exampleCsv,
  fileName,
  onFileSelected,
  parsed,
  ready,
  submitting,
  success,
}: {
  activeProvidersCount: number
  error: string | null
  exampleCsv: string
  fileName: string
  onFileSelected: (file: File | undefined) => void
  parsed: SimImportParseResult
  ready: boolean
  submitting: boolean
  success: string | null
}) {
  const hasCsv = fileName || parsed.rows.length > 0 || parsed.errors.length > 0

  return (
    <Card className="p-5">
      {activeProvidersCount === 0 && (
        <Alert className="mb-5" variant="destructive">
          <AlertTitle>Sin credenciales activas</AlertTitle>
          <AlertDescription>
            Configura al menos una credencial activa antes de importar SIMs.
            <div className="mt-2">
              <Link className="font-semibold underline" href="/dashboard/credentials">
                Ir a credenciales
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}
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
        <pre className="mt-3 overflow-x-auto rounded bg-card p-3 text-xs text-title">{exampleCsv}</pre>
      </div>

      {hasCsv && (
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
        <Button type="submit" disabled={!ready} loading={submitting} loadingText="Importando...">
          Importar SIMs
        </Button>
      </div>
    </Card>
  )
}

