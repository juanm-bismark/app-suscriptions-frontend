"use client"

export function LoadingFooter({
  cursor,
  label,
}: {
  cursor?: string
  label: string
}) {
  return (
    <div className="flex items-center border-t border-border bg-card px-6 py-2.5">
      <div className="flex w-full flex-wrap items-center justify-between gap-3.5 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-2.5 font-mono">
          <span>{cursor ? "Cargando página" : "Página 1"} · {label}</span>
          <span>consulta en curso</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-[7px] font-semibold">
            Mostrar
            <span className="h-8 w-[62px] rounded-[5px] border border-border bg-card" />
          </span>
          <span className="h-8 w-[72px] rounded-[5px] border border-slate-border/45 bg-previous-soft" />
          <span className="h-8 w-[78px] rounded-[5px] border border-soft-focus bg-next-soft" />
        </div>
      </div>
    </div>
  )
}
