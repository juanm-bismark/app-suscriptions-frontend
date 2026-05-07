"use client"

import { useMemo, useState } from "react"
import { selectMoabitsCompanyCodes } from "@/app/actions/credentials"
import { Alert, AlertDescription, Button, Checkbox } from "@/components/ui"
import type { MoabitsCompanyDiscoveryOut } from "@/lib/types/api"

export function MoabitsCompanySelector({ discovery }: { discovery: MoabitsCompanyDiscoveryOut }) {
  const initial = useMemo(() => new Set(discovery.selected_company_codes), [discovery.selected_company_codes])
  const [selected, setSelected] = useState<Set<string>>(initial)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function toggle(code: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  async function submit() {
    setError(null)
    setSuccess(null)

    if (selected.size < 1) {
      setError("Selecciona al menos una compania.")
      return
    }

    setPending(true)
    const company_codes = discovery.companies
      .filter((company) => selected.has(company.companyCode))
      .map((company) => ({
        companyCode: company.companyCode,
        companyName: company.companyName,
        clie_id: company.clie_id,
      }))

    const result = await selectMoabitsCompanyCodes({ company_codes })
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSuccess("Companias Moabits actualizadas correctamente.")
  }

  return (
    <div className="space-y-4">
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

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
          {discovery.companies.map((company) => (
            <label
              key={company.companyCode}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-page/60 cursor-pointer"
            >
              <Checkbox
                checked={selected.has(company.companyCode)}
                onChange={() => toggle(company.companyCode)}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-title truncate">{company.companyName}</span>
                <span className="block text-xs text-muted font-mono">{company.companyCode}</span>
              </span>
              <span className="text-xs text-muted font-mono">{company.clie_id ?? "sin clie_id"}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{selected.size} seleccionada(s)</p>
        <Button type="button" onClick={submit} disabled={pending}>
          Guardar seleccion
        </Button>
      </div>
    </div>
  )
}
