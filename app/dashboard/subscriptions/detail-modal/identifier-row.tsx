"use client"

import { Icon } from "../primitives"

export function IdentifierRow({
  label,
  description,
  value,
  color,
  onCopy,
  isCopied,
  isMissing,
}: {
  label: string
  description: string
  value: string
  color: string
  onCopy?: () => void
  isCopied?: boolean
  isMissing?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 px-[18px] py-[13px] border-b border-divider sm:flex-nowrap">
      <div className="w-[3px] self-stretch rounded-sm shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-xs font-extrabold text-title tracking-wider uppercase">{label}</span>
          <span className="text-[11.5px] text-muted font-medium">{description}</span>
        </div>
        <div
          className={`break-all font-mono text-[14.5px] font-semibold ${
            isMissing ? "text-muted italic" : "text-title"
          }`}
        >
          {isMissing ? "No disponible en este proveedor" : value}
        </div>
      </div>
      {!isMissing && onCopy && (
        <button
          type="button"
          onClick={onCopy}
          title={`Copiar ${label}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold border border-border/45 bg-card text-text transition-colors"
          style={
            isCopied
              ? { borderColor: color, background: `${color}1a`, color }
              : undefined
          }
        >
          {isCopied ? <Icon.check size={11} /> : <Icon.copy size={11} />}
          {isCopied ? "Copiado" : "Copiar"}
        </button>
      )}
    </div>
  )
}

