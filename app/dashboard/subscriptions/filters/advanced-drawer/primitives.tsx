"use client"

import type { ReactNode } from "react"
import { Icon } from "../../primitives"
import { T } from "../../tokens"
import type { TristateFilter } from "../advanced-filters"

export function Divider() {
  return <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />
}

export function DrawerGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, marginBottom: 8 }}>{title}</div>
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
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.pageBg, border: `1px solid ${value.trim() ? T.headerBg : T.border}`, borderRadius: 4, padding: "6px 9px" }}>
        <span style={{ color: T.muted, display: "inline-flex", flexShrink: 0 }}><Icon.search size={13} /></span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12.5, fontFamily: T.fontBody, color: T.text, minWidth: 0 }}
        />
        {value && (
          <button type="button" onClick={() => onChange("")} style={{ border: "none", background: "transparent", color: T.muted, cursor: "pointer", lineHeight: 0, padding: 2, flexShrink: 0 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map((option) => {
          const active = value === option.key
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              style={{
                flex: 1,
                padding: "5px 8px",
                border: `1px solid ${active ? option.tone : T.border}`,
                background: active ? option.tone : "#fff",
                color: active ? "#fff" : T.text,
                borderRadius: 4,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: T.fontBody,
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

