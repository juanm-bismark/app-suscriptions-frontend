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
  danger: "#C85A4A",
  success: "#2D8A6F",
  warning: "#C58A1E",
  info: "#33A6B2",
} as const;

export type SourceId = "kite" | "tele2" | "moabits";

export interface SourceMeta {
  id: SourceId;
  name: string;
  shortName: string;
  color: string;
  tintBg: string;
  tintText: string;
  description: string;
}

export const SOURCES: Record<SourceId, SourceMeta> = {
  kite: {
    id: "kite",
    name: "Kite",
    shortName: "KT",
    color: "#33A6B2",
    tintBg: "#E0F2F3",
    tintText: "#0F5F67",
    description: "Fibra óptica residencial",
  },
  tele2: {
    id: "tele2",
    name: "Tele2",
    shortName: "T2",
    color: "#7B4FE0",
    tintBg: "#EDE5FB",
    tintText: "#422889",
    description: "Telefonía móvil + datos",
  },
  moabits: {
    id: "moabits",
    name: "Moabits",
    shortName: "MB",
    color: "#E07A3A",
    tintBg: "#FCEADC",
    tintText: "#7A3A10",
    description: "Servicios corporativos / IoT",
  },
};

export type StatusId =
  | "active"
  | "paused"
  | "overdue"
  | "canceled"
  | "pending"
  | "trial";

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

export const STATUS_META: Record<StatusId, StatusMeta> = {
  active: { label: "Activa", color: "#2D8A6F", bg: "#D7ECE4", dot: "#2D8A6F" },
  paused: { label: "Pausada", color: "#C58A1E", bg: "#FBEFD4", dot: "#E0A93F" },
  overdue: { label: "En mora", color: "#C85A4A", bg: "#FADDD6", dot: "#D86550" },
  canceled: { label: "Cancelada", color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
  pending: { label: "Pendiente", color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
  trial: { label: "En prueba", color: "#7B4FE0", bg: "#E9DFFB", dot: "#7B4FE0" },
};
