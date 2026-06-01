import { positiveInt } from "@/lib/utils"

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 25

export function pageSizeFrom(value: string | null | undefined) {
  const parsed = positiveInt(value, DEFAULT_PAGE_SIZE)
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE
}

export function parseCursorStack(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

export function setParam(params: URLSearchParams, key: string, value: string | null | undefined) {
  if (value) params.set(key, value)
  else params.delete(key)
}

export function dropPaginationParams(params: URLSearchParams) {
  params.delete("cursor")
  params.delete("cursor_stack")
  params.delete("page")
}
