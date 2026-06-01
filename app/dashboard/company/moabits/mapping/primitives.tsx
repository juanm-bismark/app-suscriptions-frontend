export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/70 px-3 py-2.5 shadow-sm shadow-header-top/5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-title">{value}</p>
    </div>
  )
}

export function CompareBox({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <div className="rounded-md bg-white/65 p-3 text-sm shadow-sm shadow-header-top/5">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-1 truncate font-semibold text-title">{title}</p>
      <p className="mt-1 truncate font-mono text-xs text-muted">{detail}</p>
    </div>
  )
}
