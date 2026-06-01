import { describe, expect, it } from "vitest"
import { parseCsvLine, parseSimsCsv } from "./import-csv"

describe("SIM import CSV helpers", () => {
  it("parses quoted CSV cells", () => {
    expect(parseCsvLine('"8957300000000000001","kite"')).toEqual(["8957300000000000001", "kite"])
    expect(parseCsvLine('"8957,300","tele2"')).toEqual(["8957,300", "tele2"])
  })

  it("accepts a header and active providers", () => {
    const result = parseSimsCsv("iccid,provider\n8957300000000000001,kite\n8957300000000000002,tele2", ["kite", "tele2"])
    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      { iccid: "8957300000000000001", provider: "kite" },
      { iccid: "8957300000000000002", provider: "tele2" },
    ])
  })

  it("rejects inactive providers", () => {
    const result = parseSimsCsv("8957300000000000001,moabits", ["kite"])
    expect(result.rows).toEqual([])
    expect(result.errors[0]).toContain("proveedor invalido")
  })
})

