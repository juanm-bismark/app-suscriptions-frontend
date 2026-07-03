import { PROVIDER_META, type ProviderMeta } from "@/lib/provider-meta"
import type { Provider } from "@/lib/types/api"

export { STATUS_TONES, statusToneForGroup } from "@/lib/status-tones"
export type { ToneMeta, StatusTone } from "@/lib/status-tones"
export { PROVIDER_NATIVE_STATUSES, nativeStatusMeta } from "@/lib/subscriptions/filters"
export type { NativeStatusMeta } from "@/lib/subscriptions/filters"

// Bismark design tokens. Single source of truth: app/globals.css (@theme).
// Every value here MUST be a var(--color-*) / color-mix over those vars so it
// cannot diverge from the Tailwind classes. Do not add hex literals.
// These references exist only for the remaining inline styles; migrated code
// should use Tailwind classes directly.
export const T = {
  pageBg: "var(--color-page)",
  cardBg: "var(--color-card)",
  border: "var(--color-border)",
  text: "var(--color-text)",
  title: "var(--color-title)",
  muted: "var(--color-muted)",

  // Brand (dark teal) — kept for primary buttons / focus states
  headerTopBg: "var(--color-header-top)",
  headerBg: "var(--color-header-bg)",
  headerAccent: "var(--color-header-accent)",
  headerClientText: "var(--color-header-client)",

  divider: "var(--color-divider)",
  zebra: "var(--color-zebra)",

  tableHeaderBg: "var(--color-table-header-bg)",
  tableHeaderText: "var(--color-table-header-text)",
  rowDivider: "var(--color-row-divider)",

  fontBody: "var(--font-sans-stack)",
  fontMono: "var(--font-mono-stack)",

  // Derived semantic
  danger: "var(--color-danger-action)",
  dangerBorderSoft: "color-mix(in srgb, var(--color-danger-action) 27%, transparent)",
  dangerBorder: "color-mix(in srgb, var(--color-danger-action) 34%, transparent)",
  dangerTint: "var(--color-danger-tint)",
  success: "var(--color-success-bg)",
  warning: "var(--color-warning-action)",
  warningBorderSoft: "color-mix(in srgb, var(--color-warning-action) 33%, transparent)",
  warningBorder: "color-mix(in srgb, var(--color-warning-action) 40%, transparent)",
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
