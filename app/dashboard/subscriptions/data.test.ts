import { describe, expect, it } from "vitest"
import { antiquityFor, fmtDate, fmtShortDate, formatVal, looksMono, prettyKey } from "./data"

describe("subscription data formatting", () => {
  it("formats short and long Spanish dates", () => {
    expect(fmtShortDate("2026-05-25T10:30:00Z")).toBe("25 May")
    expect(fmtDate("2026-05-25T10:30:00Z")).toBe("25 may 2026")
  })

  it("keeps invalid dates readable", () => {
    expect(fmtShortDate("not-a-date")).toBe("not-a-date")
    expect(fmtDate("not-a-date")).toBe("not-a-date")
  })

  it("computes antiquity from an explicit reference date", () => {
    const now = new Date("2026-05-25T00:00:00Z")

    expect(antiquityFor("2026-05-20T00:00:00Z", now)).toBe("Nueva")
    expect(antiquityFor("2026-03-25T00:00:00Z", now)).toBe("2 meses")
    expect(antiquityFor("2025-03-25T00:00:00Z", now)).toBe("1a 2m")
  })

  it("formats display values and labels", () => {
    expect(prettyKey("iccid")).toBe("ICCID")
    expect(formatVal(true)).toBe("Sí")
    expect(formatVal(["a", "b"])).toBe("a, b")
    expect(looksMono("device_id")).toBe(true)
  })
})
