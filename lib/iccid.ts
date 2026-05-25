export const MAX_ICCID_BATCH = 200

const ICCID_PATTERN = /^\d{18,22}$/
const ICCID_SEPARATOR_PATTERN = /[\s,;|\n]+/

export function isIccid(value: string) {
  return ICCID_PATTERN.test(value.trim())
}

export function parseIccidList(value: string | null | undefined, limit = MAX_ICCID_BATCH): string[] {
  return Array.from(
    new Set(
      (value ?? "")
        .split(ICCID_SEPARATOR_PATTERN)
        .map((item) => item.trim())
        .filter(isIccid),
    ),
  ).slice(0, limit)
}
