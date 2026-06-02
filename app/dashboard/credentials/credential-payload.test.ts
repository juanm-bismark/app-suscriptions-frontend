import { describe, expect, it } from "vitest"
import { KITE_DEFAULT_ENDPOINT } from "./form/config"
import { credentialDefaults } from "./credential-payload"

describe("credential payload defaults", () => {
  it("pre-fills Kite with the official SOAP endpoint", () => {
    expect(credentialDefaults("kite").credentials).toMatchObject({
      endpoint: KITE_DEFAULT_ENDPOINT,
    })
  })
})
