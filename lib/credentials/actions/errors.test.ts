import { describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}))

import { ApiError } from "@/lib/api-client"
import {
  invalidProviderError,
  toAdminProbeError,
  toCredentialProbeResult,
  toCredentialTestResult,
} from "./errors"

describe("credential action error helpers", () => {
  it("returns a stable invalid provider action error", () => {
    expect(invalidProviderError()).toMatchObject({
      ok: false,
      code: "invalid_provider",
      status: 422,
    })
  })

  it("maps failed test payloads to action errors", () => {
    expect(toCredentialTestResult({ ok: false, detail: "bad creds", provider: "kite" })).toMatchObject({
      ok: false,
      error: "bad creds",
      code: "credential_test_failed",
    })
  })

  it("maps failed probe payloads to action errors", () => {
    expect(toCredentialProbeResult({ ok: false, detail: "no route", provider: "moabits", sample_count: 0 })).toMatchObject({
      ok: false,
      error: "no route",
      code: "credential_probe_failed",
    })
  })

  it("uses provider-specific admin probe messages", () => {
    const error = new ApiError(429, "limited", {
      code: "provider.rate_limited",
      detail: "limited",
      retryAfter: 12,
    })
    expect(toAdminProbeError(error)).toMatchObject({
      ok: false,
      error: "Rate limit del proveedor. Reintenta en 12s.",
      status: 429,
      code: "provider.rate_limited",
    })
  })
})
