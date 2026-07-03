"use client"

import type { ReactNode } from "react"
import { PROVIDER_IDS as SHARED_PROVIDER_IDS } from "@/lib/provider-meta"
import { isProvider } from "@/lib/subscriptions/filters"
import { cn } from "@/lib/utils"
import { SOURCES, type SourceId } from "../tokens"

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
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      <div className="mr-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-muted">
        Fuente
      </div>
      {canSelectAllSources(providerIds) && (
        <SourceTabButton
          active={activeSource === "all"}
          color="var(--color-header-bg)"
          icon={
            <span
              className="inline-flex h-3.5 w-3.5 rounded-full"
              style={{
                backgroundImage: activeSource === "all" ? undefined : conicGradient,
                backgroundColor: activeSource === "all" ? "rgba(255,255,255,.18)" : undefined,
              }}
            />
          }
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
            icon={
              <span
                className="h-3.5 w-3.5 rounded-[3px]"
                style={{ background: active ? "rgba(255,255,255,.18)" : source.color }}
              />
            }
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
      className={cn(
        "inline-flex items-center gap-2 rounded border py-1.5 pl-2.5 pr-[11px] text-[12.5px] font-semibold tracking-[-0.1px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
        active ? "text-white" : "border-border bg-card text-title",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
      style={active ? { background: color, borderColor: color } : undefined}
    >
      {icon}
      {label}
    </button>
  )
}
