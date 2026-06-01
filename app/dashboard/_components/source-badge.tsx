import type { Provider } from "@/lib/types/api"
import { PROVIDER_META } from "@/lib/provider-meta"

const FONT_BODY = "Inter, Arial, Helvetica, sans-serif"
const FONT_MONO = "'JetBrains Mono', 'Courier New', Courier, monospace"

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
      style={{
        width: dim.box,
        height: dim.box,
        borderRadius: 4,
        background: provider.color,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_MONO,
        fontSize: dim.fs,
        fontWeight: 700,
        letterSpacing: -0.5,
        flexShrink: 0,
      }}
    >
      {provider.name[0].toUpperCase()}
    </span>
  )

  if (!withName) return glyph

  return (
    <span
      className="text-title"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: dim.gap,
        fontFamily: FONT_BODY,
        fontSize: dim.label,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {glyph}
      {provider.name}
    </span>
  )
}
