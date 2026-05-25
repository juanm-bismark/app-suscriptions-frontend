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

export interface ToneMeta {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

export type StatusTone = "success" | "test" | "warn" | "danger" | "neutral" | "info";

export const STATUS_TONES: Record<StatusTone, ToneMeta> = {
  success: { label: "",  color: "#2D8A6F", bg: "#D7ECE4", dot: "#2D8A6F" },
  test:    { label: "",  color: "#7B4FE0", bg: "#E9DFFB", dot: "#7B4FE0" },
  warn:    { label: "",  color: "#C58A1E", bg: "#FBEFD4", dot: "#E0A93F" },
  danger:  { label: "",  color: "#C85A4A", bg: "#FADDD6", dot: "#D86550" },
  neutral: { label: "",  color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
  info:    { label: "",  color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
};

export type NormalizedStatusGroup =
  | "active_like"
  | "suspended_like"
  | "test_like"
  | "terminal_like"
  | "purged_like"
  | "unknown"
  | "other"
  | (string & {});

export function statusToneForGroup(group: string | null | undefined): StatusTone {
  switch ((group ?? "").trim().toLowerCase()) {
    case "active_like":
      return "success";
    case "suspended_like":
      return "warn";
    case "test_like":
      return "info";
    case "terminal_like":
    case "purged_like":
      return "danger";
    case "unknown":
    case "other":
    default:
      return "neutral";
  }
}

// Each provider exposes its own set of native status strings. We never normalize
// them across providers — we only attach a friendly Spanish label and a tone for
// the badge palette. `value` must match exactly what the backend returns.
export interface NativeStatusMeta {
  value: string;
  label: string;
  tone: StatusTone;
}

export const PROVIDER_NATIVE_STATUSES: Record<SourceId, NativeStatusMeta[]> = {
  kite: [
    { value: "ACTIVE",             label: "Activa",             tone: "success" },
    { value: "TEST",               label: "En prueba",          tone: "test"    },
    { value: "ACTIVATION_READY",   label: "Lista p/ activar",   tone: "info"    },
    { value: "ACTIVATION_PENDANT", label: "Pendiente activ.",   tone: "info"    },
    { value: "INACTIVE_NEW",       label: "Inactiva (nueva)",   tone: "info"    },
    { value: "DEACTIVATED",        label: "Desactivada",        tone: "warn"    },
    { value: "SUSPENDED",          label: "Suspendida",         tone: "warn"    },
    { value: "RESTORE",            label: "Restauración",       tone: "info"    },
    { value: "RETIRED",            label: "Retirada",           tone: "neutral" },
  ],
  tele2: [
    { value: "ACTIVATED",        label: "Activa",             tone: "success" },
    { value: "TEST_READY",       label: "Lista p/ prueba",    tone: "test"    },
    { value: "ACTIVATION_READY", label: "Lista p/ activar",   tone: "info"    },
    { value: "INVENTORY",        label: "Inventario",         tone: "neutral" },
    { value: "DEACTIVATED",      label: "Desactivada",        tone: "warn"    },
    { value: "REPLACED",         label: "Reemplazada",        tone: "neutral" },
    { value: "RETIRED",          label: "Retirada",           tone: "neutral" },
    { value: "PURGED",           label: "Purgada",            tone: "danger"  },
  ],
  moabits: [
    { value: "Active",    label: "Activa",     tone: "success" },
    { value: "Ready",     label: "Lista",      tone: "info"    },
    { value: "Suspended", label: "Suspendida", tone: "warn"    },
  ],
};

export function nativeStatusMeta(
  provider: SourceId,
  value: string | null | undefined,
): NativeStatusMeta {
  const v = (value ?? "").trim();
  if (v) {
    const found = PROVIDER_NATIVE_STATUSES[provider]?.find(
      (s) => s.value.toLowerCase() === v.toLowerCase(),
    );
    if (found) return found;
    return { value: v, label: v, tone: "neutral" };
  }
  return { value: "", label: "Desconocida", tone: "neutral" };
}
