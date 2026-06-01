"use client"

import type { ReactNode } from "react"
import { PROVIDER_IDS as SHARED_PROVIDER_IDS } from "@/lib/provider-meta"
import { isProvider } from "@/lib/subscriptions/filters"
import { SOURCES, type SourceId, T } from "../tokens"

export type SourceFilter = SourceId | "all"

export const PROVIDER_IDS = SHARED_PROVIDER_IDS

export function isSourceId(value: string | null | undefined): value is SourceId {
  return isProvider(value)
}

export function sanitizeProviderIds(providers?: readonly SourceId[] | null): SourceId[] {
  const unique = new Set<SourceId>()
  for (const provider of providers ?? PROVIDER_IDS) {
    if (provider in SOURCES) unique.add(provider)
  }
  return PROVIDER_IDS.filter((provider) => unique.has(provider))
}

export function getEffectiveSource(requestedProvider: string | null | undefined, providerIds: readonly SourceId[]): SourceFilter {
  if (isSourceId(requestedProvider) && providerIds.includes(requestedProvider)) return requestedProvider
  if (providerIds.length === 1) return providerIds[0]
  return "all"
}

export function canSelectAllSources(providerIds: readonly SourceId[]) {
  return providerIds.length > 1
}

export function sourceConicGradient(providerIds: readonly SourceId[]) {
  if (!providerIds.length) return "none"
  return "conic-gradient(" +
    providerIds.map((provider) => SOURCES[provider])
      .map((source, index, all) => `${source.color} ${(index * 100) / all.length}% ${((index + 1) * 100) / all.length}%`)
      .join(",") +
    ")"
}

export function SourceFilterTabs({
  activeSource,
  providerIds,
  onChange,
}: {
  activeSource: SourceFilter
  providerIds: readonly SourceId[]
  onChange?: (source: SourceFilter) => void
}) {
  const conicGradient = sourceConicGradient(providerIds)
  const interactive = Boolean(onChange)

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ fontSize: 11, color: T.muted, marginRight: 4, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
        Fuente
      </div>
      {canSelectAllSources(providerIds) && (
        <SourceTabButton
          active={activeSource === "all"}
          color={T.headerBg}
          icon={<span style={{ width: 14, height: 14, borderRadius: "50%", backgroundImage: activeSource === "all" ? undefined : conicGradient, backgroundColor: activeSource === "all" ? "rgba(255,255,255,.18)" : undefined, display: "inline-flex" }} />}
          label="Todas"
          onClick={interactive ? () => onChange?.("all") : undefined}
        />
      )}
      {providerIds.map((provider) => {
        const source = SOURCES[provider]
        const active = activeSource === provider
        return (
          <SourceTabButton
            key={source.id}
            active={active}
            color={source.color}
            icon={<span style={{ width: 14, height: 14, borderRadius: 3, background: active ? "rgba(255,255,255,.18)" : source.color }} />}
            label={source.name}
            onClick={interactive ? () => onChange?.(source.id) : undefined}
          />
        )
      })}
    </div>
  )
}

function SourceTabButton({
  active,
  color,
  icon,
  label,
  onClick,
}: {
  active: boolean
  color: string
  icon: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 11px 6px 9px",
        background: active ? color : "#fff",
        border: `1px solid ${active ? color : T.border}`,
        borderRadius: 4,
        color: active ? "#fff" : T.title,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: onClick ? "pointer" : "default",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: T.fontBody,
        letterSpacing: -0.1,
      }}
    >
      {icon}
      {label}
    </button>
  )
}
