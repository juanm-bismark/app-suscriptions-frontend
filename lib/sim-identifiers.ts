import { isIccid } from "@/lib/iccid"

export type SearchField = "iccid" | "imsi" | "msisdn"
export type SearchMode = "auto" | SearchField

export const AMBIGUOUS_IDENTIFIER_FIELDS: SearchField[] = ["imsi", "msisdn"]
export const NUMERIC_IDENTIFIER_PATTERN = /^\d{5,17}$/

export const SEARCH_MODE_OPTIONS: { id: SearchMode; label: string; title: string }[] = [
  { id: "auto", label: "Auto", title: "Detectar identificador" },
  { id: "iccid", label: "ICCID", title: "Buscar por ICCID" },
  { id: "msisdn", label: "MSISDN", title: "Buscar por MSISDN" },
  { id: "imsi", label: "IMSI", title: "Buscar por IMSI" },
]

export function isSearchField(value: string | null | undefined): value is SearchField {
  return value === "iccid" || value === "imsi" || value === "msisdn"
}

export function identifierSearchFields(query: string, searchMode: SearchMode): SearchField[] {
  const normalized = query.trim()
  if (!normalized) return []
  if (searchMode !== "auto") return [searchMode]
  if (isIccid(normalized) || !NUMERIC_IDENTIFIER_PATTERN.test(normalized)) return []
  return AMBIGUOUS_IDENTIFIER_FIELDS
}

export function shouldSearchImsiAndMsisdn(query: string | undefined, searchField: SearchField | undefined) {
  const normalized = query?.trim()
  return Boolean(!searchField && normalized && !isIccid(normalized) && NUMERIC_IDENTIFIER_PATTERN.test(normalized))
}

export function isExactIccidQuery(value: string) {
  return isIccid(value)
}

export function searchPlaceholder(searchMode: SearchMode) {
  if (searchMode === "iccid") return "ICCID exacto o varios ICCIDs separados por espacio o coma"
  if (searchMode === "msisdn") return "MSISDN"
  if (searchMode === "imsi") return "IMSI"
  return "ICCID, MSISDN o IMSI"
}
