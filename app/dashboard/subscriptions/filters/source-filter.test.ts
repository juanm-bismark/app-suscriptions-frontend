import { describe, expect, it } from "vitest"
import { getEffectiveSource } from "./source-filter"

describe("subscription source filter helpers", () => {
  it("auto-selects the only active provider", () => {
    expect(getEffectiveSource(undefined, ["moabits"])).toBe("moabits")
  })

  it("keeps all when multiple providers are available and request is missing", () => {
    expect(getEffectiveSource(undefined, ["kite", "tele2"])).toBe("all")
  })

  it("ignores requested providers outside the active credentials", () => {
    expect(getEffectiveSource("moabits", ["kite", "tele2"])).toBe("all")
  })
})

