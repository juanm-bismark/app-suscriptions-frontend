import { describe, expect, it } from "vitest"
import { positiveInt } from "./utils"

describe("positiveInt", () => {
  it("returns positive integer params", () => {
    expect(positiveInt("1", 25)).toBe(1)
    expect(positiveInt("100", 25)).toBe(100)
  })

  it("falls back for missing, zero, negative, and decimal values", () => {
    expect(positiveInt(undefined, 25)).toBe(25)
    expect(positiveInt(null, 25)).toBe(25)
    expect(positiveInt("0", 25)).toBe(25)
    expect(positiveInt("-1", 25)).toBe(25)
    expect(positiveInt("1.5", 25)).toBe(25)
    expect(positiveInt("abc", 25)).toBe(25)
  })
})
