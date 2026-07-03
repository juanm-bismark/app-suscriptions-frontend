"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "../../primitives"
import { T } from "../../tokens"
import type { TristateFilter } from "../advanced-filters"

export function Divider() {
  return <div className="my-4 h-px bg-divider" />
}

export function DrawerGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold tracking-[1px] text-muted">{title}</div>
      {children}
    </div>
  )
}

export function IndexedTextFilters({
  labelPrefix,
  values,
  onChange,
}: {
  labelPrefix: string
  values: string[]
  onChange: (index: number, value: string) => void
}) {
  return (
    <>
      {values.map((value, index) => (
        <TextFilterInput
          key={`${labelPrefix}-${index}`}
          label={`${labelPrefix} ${index + 1}`}
          value={value}
          onChange={(nextValue) => onChange(index, nextValue)}
          placeholder={`${labelPrefix.replace(/\s+/g, "")}${index + 1}`}
        />
      ))}
    </>
  )
}

export function TextFilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">{label}</span>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded border bg-page px-2.5 py-1.5",
          value.trim() ? "border-header-bg" : "border-border"
        )}
      >
        <span className="inline-flex shrink-0 text-muted"><Icon.search size={13} /></span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-none bg-transparent text-[12.5px] text-text outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 p-0.5 leading-none text-muted transition-colors hover:text-title"
          >
            <Icon.close size={11} />
          </button>
        )}
      </div>
    </label>
  )
}

export function TristateRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: TristateFilter
  onChange: (value: TristateFilter) => void
}) {
  const options: { key: TristateFilter; label: string; tone: string }[] = [
    { key: "any", label: "Cualquiera", tone: T.muted },
    { key: "on", label: "Activo", tone: T.success },
    { key: "off", label: "Inactivo", tone: T.danger },
  ]
  return (
    <div className="flex flex-col gap-[5px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.5px] text-muted">{label}</span>
      <div className="flex gap-1">
        {options.map((option) => {
          const active = value === option.key
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={cn(
                "flex-1 rounded border px-2 py-[5px] text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
                active ? "text-white" : "border-border bg-card text-text hover:bg-hover-soft"
              )}
              style={active ? { borderColor: option.tone, background: option.tone } : undefined}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
