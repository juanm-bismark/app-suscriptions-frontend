import { Link2, Link2Off } from "lucide-react"
import type { CompanyProviderMappingOut } from "@/lib/types/api"

type Props = {
  mapping: CompanyProviderMappingOut | null
  error: string | null
}

export function MoabitsCompanyMappingInfo({ mapping, error }: Props) {
  return (
    <section className="bg-[#F5FAFA] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
      <h2 className="text-xl font-semibold text-title mb-1">Vinculación Moabits</h2>
      <p className="text-sm text-muted mb-4">
        Empresa Moabits asignada a tu compañía para sincronización de suscripciones.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-[#FFF7E7] p-4 text-sm text-[#6D4D16] shadow-sm shadow-warn-bg/5">
          {error}
        </div>
      )}

      {mapping ? (
        <div className="rounded-lg bg-white/70 p-4 shadow-sm shadow-header-top/5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#DDF1F2] text-[#12343B]">
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-title truncate">
                {mapping.companyName ?? mapping.companyCode}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted">
                Código: {mapping.companyCode}
                {mapping.clie_id != null && <> · clie_id: {mapping.clie_id}</>}
              </p>
              <p className="mt-1 text-xs text-muted">
                Actualizado {formatDate(mapping.updated_at)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        !error && (
          <div className="flex items-center gap-3 rounded-lg bg-white/55 p-4 shadow-sm shadow-header-top/5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F5EAEA] text-[#7A3535]">
              <Link2Off className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-title">Sin vinculación configurada</p>
              <p className="mt-0.5 text-xs text-muted">
                Tu empresa no tiene una empresa Moabits asignada. Contacta a un administrador.
              </p>
            </div>
          </div>
        )
      )}
    </section>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(date)
}
