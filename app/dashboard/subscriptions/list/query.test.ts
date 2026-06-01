import { describe, expect, it } from "vitest"
import { queryRequestsFor } from "./query"

describe("subscription query request builder", () => {
  it("queries only searchable providers for text search in global auto mode", () => {
    const requests = queryRequestsFor(undefined, "acme", undefined, {}, ["kite", "tele2", "moabits"], "auto")
    expect(requests.map((request) => request.provider)).toEqual(["kite", "tele2"])
  })

  it("fans out ambiguous numeric global search to IMSI and MSISDN", () => {
    const requests = queryRequestsFor(undefined, "573001234567", undefined, {}, ["kite", "tele2"], "auto")
    expect(requests.map((request) => request.searchField)).toEqual(["imsi", "msisdn"])
  })

  it("keeps multiple ICCIDs in one batched request", () => {
    const requests = queryRequestsFor("kite", "8957300000000000001 8957300000000000002", undefined, {}, ["kite"], "iccid")
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ provider: "kite", failureProvider: "kite" })
    expect(requests[0].iccid).toContain("8957300000000000001")
    expect(requests[0].iccid).toContain("8957300000000000002")
  })
})

