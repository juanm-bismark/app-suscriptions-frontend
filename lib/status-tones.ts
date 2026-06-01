export interface ToneMeta {
  label: string
  color: string
  bg: string
  dot: string
}

export type StatusTone = "success" | "test" | "warn" | "danger" | "neutral" | "info"

export const STATUS_TONES: Record<StatusTone, ToneMeta> = {
  success: { label: "", color: "#2D8A6F", bg: "#D7ECE4", dot: "#2D8A6F" },
  test: { label: "", color: "#7B4FE0", bg: "#E9DFFB", dot: "#7B4FE0" },
  warn: { label: "", color: "#C58A1E", bg: "#FBEFD4", dot: "#E0A93F" },
  danger: { label: "", color: "#C85A4A", bg: "#FADDD6", dot: "#D86550" },
  neutral: { label: "", color: "#6B7480", bg: "#E5E8EC", dot: "#8B93A0" },
  info: { label: "", color: "#326472", bg: "#D7E7EC", dot: "#33A6B2" },
}

export function statusToneForGroup(group: string | null | undefined): StatusTone {
  switch ((group ?? "").trim().toLowerCase()) {
    case "active_like":
      return "success"
    case "suspended_like":
      return "warn"
    case "test_like":
      return "info"
    case "terminal_like":
    case "purged_like":
      return "danger"
    case "unknown":
    case "other":
    default:
      return "neutral"
  }
}
