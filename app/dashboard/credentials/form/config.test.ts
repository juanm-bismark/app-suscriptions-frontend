import { describe, expect, it } from "vitest"
import { getSchema, KITE_DEFAULT_ENDPOINT } from "./config"

const validKitePayload = {
  credentials: {
    endpoint: KITE_DEFAULT_ENDPOINT,
    client_cert_pfx_b64: "UEZY",
    client_cert_password: "secret",
  },
  account_scope: {
    environment: "production",
  },
}

describe("credential form config", () => {
  it("requires Kite certificate base64 and password for admin saves", () => {
    const result = getSchema("kite", true).safeParse({
      ...validKitePayload,
      credentials: {
        ...validKitePayload.credentials,
        client_cert_pfx_b64: "",
        client_cert_password: "",
      },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."))
      expect(paths).toContain("credentials.client_cert_pfx_b64")
      expect(paths).toContain("credentials.client_cert_password")
    }
  })

  it("accepts the generated Kite certificate base64 value", () => {
    expect(getSchema("kite", true).safeParse(validKitePayload).success).toBe(true)
  })
})
