import { describe, expect, it } from "vitest"
import { loadingLabel, providersForLoadingRows } from "./utils"

describe("subscription loading helpers", () => {
  it("uses the selected provider in row skeletons", () => {
    expect(providersForLoadingRows("moabits", {}, ["kite", "moabits"])).toEqual(["moabits"])
  })

  it("uses providers with selected statuses first", () => {
    expect(providersForLoadingRows("all", { tele2: new Set(["ACTIVATED"]) }, ["kite", "tele2", "moabits"])).toEqual(["tele2"])
  })

  it("describes provider-specific loading states", () => {
    expect(loadingLabel("moabits", "active", {}, undefined, ["moabits"])).toContain("Moabits")
  })

  it("describes query loading when there are no selected statuses", () => {
    expect(loadingLabel("all", undefined, {}, "573001234567", ["kite", "tele2"])).toBe("Buscando 573001234567")
  })
})

