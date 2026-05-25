type QueryValue = string | number | boolean | null | undefined

export function buildHref(path: string, query: Record<string, QueryValue>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue
    params.set(key, String(value))
  }

  const serialized = params.toString()
  return serialized ? `${path}?${serialized}` : path
}
