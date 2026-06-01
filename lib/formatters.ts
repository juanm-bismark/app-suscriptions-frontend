type DateFormatOptions = {
  fallback?: string
  invalidFallback?: string
  locale?: string
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"]
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"]
}

export function formatDate(value: string | null | undefined, options: DateFormatOptions = {}) {
  const {
    fallback = "—",
    invalidFallback = fallback,
    locale = "es-CO",
    dateStyle = "medium",
    timeStyle,
  } = options

  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return invalidFallback

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    ...(timeStyle ? { timeStyle } : {}),
  }).format(date)
}

export function formatDateTime(value: string | null | undefined, options: Omit<DateFormatOptions, "timeStyle"> = {}) {
  return formatDate(value, { ...options, timeStyle: "short" })
}
