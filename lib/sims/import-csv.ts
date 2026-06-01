import type { Provider, SimImportIn } from "@/lib/types/api"

export type ParsedSimImportRow = SimImportIn["sims"][number]
export type SimImportParseResult = {
  rows: ParsedSimImportRow[]
  errors: string[]
}

function isActiveProvider(value: string, activeProviders: readonly Provider[]): value is Provider {
  return activeProviders.includes(value as Provider)
}

export function parseCsvLine(line: string): string[] {
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

export function parseSimsCsv(text: string, activeProviders: readonly Provider[]): SimImportParseResult {
  const rows: ParsedSimImportRow[] = []
  const errors: string[] = []
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/)

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()
    const lineNumber = index + 1
    if (!line) return

    const cells = parseCsvLine(line)
    const [iccidRaw, providerRaw] = cells
    const iccid = iccidRaw?.trim()
    const provider = providerRaw?.trim().toLowerCase()

    if (lineNumber === 1 && iccid?.toLowerCase() === "iccid" && provider === "provider") {
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

    if (!provider || !isActiveProvider(provider, activeProviders)) {
      errors.push(`Linea ${lineNumber}: proveedor invalido o sin credencial activa (${providerRaw || "vacio"}).`)
      return
    }

    rows.push({ iccid, provider })
  })

  if (rows.length === 0 && errors.length === 0) {
    errors.push("El CSV no tiene filas para importar.")
  }

  return { rows, errors }
}

