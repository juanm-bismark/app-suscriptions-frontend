import { describe, expect, it } from "vitest"
import { z } from "zod"
import { actionErrorMessage, firstZodIssue } from "./action-error"

describe("action error helpers", () => {
  it("returns the first zod issue message", () => {
    const result = z.object({ name: z.string().min(2, "Nombre muy corto") }).safeParse({ name: "" })
    if (result.success) throw new Error("Expected validation to fail")

    expect(firstZodIssue(result.error)).toBe("Nombre muy corto")
  })

  it("prefers problem details over generic error messages", () => {
    expect(actionErrorMessage({ detail: "Detalle del API", title: "Titulo" }, "Fallback")).toBe("Detalle del API")
    expect(actionErrorMessage({ title: "Titulo" }, "Fallback")).toBe("Titulo")
  })

  it("falls back through Error, string, and fallback values", () => {
    expect(actionErrorMessage(new Error("Error real"), "Fallback")).toBe("Error real")
    expect(actionErrorMessage("Error string", "Fallback")).toBe("Error string")
    expect(actionErrorMessage(null, "Fallback")).toBe("Fallback")
  })
})
