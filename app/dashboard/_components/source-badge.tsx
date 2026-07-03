import type { Provider } from "@/lib/types/api"
import { PROVIDER_META } from "@/lib/provider-meta"
import { cn } from "@/lib/utils"

export function SourceBadge({
  source,
  size = "md",
  withName = false,
}: {
  source: Provider
  size?: "sm" | "md" | "lg"
  withName?: boolean
}) {
  const provider = PROVIDER_META[source]
  if (!provider) return null
  const dim =
    size === "sm"
      ? { box: 18, fs: 10, gap: 6, label: 11.5 }
      : size === "lg"
        ? { box: 28, fs: 14, gap: 9, label: 13.5 }
        : { box: 22, fs: 11.5, gap: 7, label: 12.5 }
  const glyph = (
    <span
      title={provider.name}
      className="inline-flex shrink-0 items-center justify-center rounded font-mono font-bold tracking-[-0.5px] text-white"
      style={{ width: dim.box, height: dim.box, background: provider.color, fontSize: dim.fs }}
    >
      {provider.name[0].toUpperCase()}
    </span>
  )

  if (!withName) return glyph

  return (
    <span
      className={cn("inline-flex items-center whitespace-nowrap font-body font-semibold text-title")}
      style={{ gap: dim.gap, fontSize: dim.label }}
    >
      {glyph}
      {provider.name}
    </span>
  )
}
