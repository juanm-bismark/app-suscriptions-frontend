import { PROVIDER_META, type ProviderMeta } from "@/lib/provider-meta"
import type { Provider } from "@/lib/types/api"

export { STATUS_TONES, statusToneForGroup } from "@/lib/status-tones"
export type { ToneMeta, StatusTone } from "@/lib/status-tones"
export { PROVIDER_NATIVE_STATUSES, nativeStatusMeta } from "@/lib/subscriptions/filters"
export type { NativeStatusMeta } from "@/lib/subscriptions/filters"

// Bismark design tokens — ported 1:1 from the design handoff (index.html).
// Inline styles use these directly; they are NOT meant to be used as Tailwind classes.
export const T = {
  pageBg: "#EEF4F4",
  cardBg: "#ffffff",
  border: "#C8DFE0",
  text: "#333333",
  title: "#111111",
  muted: "#555E6B",

  // Light chrome (final design — chat7)
  chromeTopBg: "#FAFCFC",
  chromeBg: "#FFFFFF",
  chromeBorder: "#DCE7E8",
  chromeText: "#0F2A2E",
  chromeMuted: "#5C7178",

  // Brand (dark teal) — kept for primary buttons / focus states
  headerTopBg: "#0F202A",
  headerBg: "#163C41",
  headerAccent: "#33A6B2",
  headerText: "#F3F7FA",
  headerSub: "#8B9AAF",
  headerClientText: "#62D7C7",

  divider: "#D4E8EA",
  zebra: "#F4FAFA",

  badgeBg: "#C8E8EA",
  badgeText: "#163C41",

  tableHeaderBg: "#F0F8F8",
  tableHeaderText: "#326472",
  rowDivider: "#EEF1F6",

  fontBody: "Inter, Arial, Helvetica, sans-serif",
  fontMono: "'JetBrains Mono', 'Courier New', Courier, monospace",

  // Derived semantic
  danger: "var(--color-danger-action)",
  dangerBorderSoft: "color-mix(in srgb, var(--color-danger-action) 27%, transparent)",
  dangerBorder: "color-mix(in srgb, var(--color-danger-action) 34%, transparent)",
  dangerTint: "var(--color-danger-tint)",
  success: "var(--color-success-bg)",
  warning: "#C58A1E",
  info: "#33A6B2",
} as const;

export type SourceId = Provider;
export type SourceMeta = ProviderMeta;
export const SOURCES: Record<SourceId, SourceMeta> = PROVIDER_META;

export type NormalizedStatusGroup =
  | "active_like"
  | "suspended_like"
  | "test_like"
  | "terminal_like"
  | "purged_like"
  | "unknown"
  | "other"
  | (string & {});

// Each provider exposes its own set of native status strings. We never normalize
// them across providers — we only attach a friendly Spanish label and a tone for
// the badge palette. `value` must match exactly what the backend returns.
