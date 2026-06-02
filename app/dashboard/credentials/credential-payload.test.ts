import { describe, expect, it } from "vitest"
import { KITE_DEFAULT_ENDPOINT } from "./form/config"
import { credentialDefaults } from "./credential-payload"

describe("credential payload defaults", () => {
  it("pre-fills Kite with the official SOAP endpoint", () => {
    expect(credentialDefaults("kite").credentials).toMatchObject({
      endpoint: KITE_DEFAULT_ENDPOINT,
    })
  })

  it("leaves optional Tele2 fields empty by default", () => {
    expect(credentialDefaults("tele2")).toMatchObject({
      credentials: {
        cobrand_url: "",
        api_version: "",
      },
      account_scope: {
        account_id: "",
        environment: "",
      },
    })
    expect(credentialDefaults("tele2").account_scope?.max_tps).toBeUndefined()
  })
})
