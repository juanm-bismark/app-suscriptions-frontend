import { describe, expect, it } from "vitest"
import { identifierSearchFields, searchPlaceholder, shouldSearchImsiAndMsisdn } from "./sim-identifiers"

describe("SIM identifier search helpers", () => {
  it("keeps exact ICCIDs out of ambiguous IMSI/MSISDN search", () => {
    expect(identifierSearchFields("8957300000000000001", "auto")).toEqual([])
    expect(shouldSearchImsiAndMsisdn("8957300000000000001", undefined)).toBe(false)
  })

  it("expands short numeric auto search to IMSI and MSISDN", () => {
    expect(identifierSearchFields("573001234567", "auto")).toEqual(["imsi", "msisdn"])
    expect(shouldSearchImsiAndMsisdn("573001234567", undefined)).toBe(true)
  })

  it("respects explicit search modes", () => {
    expect(identifierSearchFields("573001234567", "msisdn")).toEqual(["msisdn"])
    expect(searchPlaceholder("imsi")).toBe("IMSI")
  })
})

