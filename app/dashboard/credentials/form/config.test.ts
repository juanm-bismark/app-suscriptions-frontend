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

const validTele2Payload = {
  credentials: {
    username: "alice",
    api_key: "secret",
  },
  account_scope: {},
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

  it("does not require Kite end_customer_id", () => {
    const result = getSchema("kite", true).safeParse({
      ...validKitePayload,
      account_scope: {
        environment: "production",
      },
    })

    expect(result.success).toBe(true)
  })

  it("allows optional Kite WS-Sec credentials only when they are provided together", () => {
    expect(getSchema("kite", true).safeParse({
      ...validKitePayload,
      credentials: {
        ...validKitePayload.credentials,
        username: "ws-user",
        password: "ws-pass",
      },
    }).success).toBe(true)

    expect(getSchema("kite", true).safeParse({
      ...validKitePayload,
      credentials: {
        ...validKitePayload.credentials,
        username: "ws-user",
      },
    }).success).toBe(false)
  })

  it("accepts the minimal Tele2 credential payload", () => {
    expect(getSchema("tele2", true).safeParse(validTele2Payload).success).toBe(true)
  })

  it("requires only Tele2 username and api_key", () => {
    const missingUsername = getSchema("tele2", true).safeParse({
      ...validTele2Payload,
      credentials: {
        api_key: "secret",
      },
    })
    const missingApiKey = getSchema("tele2", true).safeParse({
      ...validTele2Payload,
      credentials: {
        username: "alice",
      },
    })

    expect(missingUsername.success).toBe(false)
    expect(missingApiKey.success).toBe(false)
  })

  it("accepts optional Tele2 metadata and supported API versions", () => {
    const result = getSchema("tele2", true).safeParse({
      credentials: {
        cobrand_url: "restapi3.jasper.com",
        username: "alice",
        api_key: "secret",
        api_version: "v1",
      },
      account_scope: {
        account_id: "TELE2_ACCOUNT_ID",
        max_tps: 5,
        environment: "production",
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects unsupported Tele2 API versions", () => {
    const result = getSchema("tele2", true).safeParse({
      ...validTele2Payload,
      credentials: {
        ...validTele2Payload.credentials,
        api_version: "v2",
      },
    })

    expect(result.success).toBe(false)
  })
})
