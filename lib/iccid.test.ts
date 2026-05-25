import { describe, expect, it } from "vitest"
import { isIccid, parseIccidList } from "./iccid"

describe("ICCID helpers", () => {
  it("accepts numeric identifiers from 18 to 22 digits", () => {
    expect(isIccid("123456789012345678")).toBe(true)
    expect(isIccid("1234567890123456789012")).toBe(true)
    expect(isIccid("12345678901234567")).toBe(false)
    expect(isIccid("12345678901234567890123")).toBe(false)
  })

  it("parses mixed separators, removes invalid values, and deduplicates", () => {
    expect(parseIccidList("123456789012345678, bad;123456789012345679|123456789012345678")).toEqual([
      "123456789012345678",
      "123456789012345679",
    ])
  })

  it("honors an explicit limit", () => {
    expect(parseIccidList("123456789012345678 123456789012345679", 1)).toEqual(["123456789012345678"])
  })
})
