"use server";

import { fetchApi } from "@/lib/api-client";
import type {
  PresenceOut,
  SimImportIn,
  SimImportOut,
  SimListOut,
  StatusChangeIn,
  SubscriptionOut,
  UsageOut,
} from "@/lib/types/api";
import type { AdministrativeStatus, Provider } from "@/lib/types/api/common";

export interface ListSimsParams {
  cursor?: string | null;
  limit?: number;
  provider?: Provider;
  status?: AdministrativeStatus;
  modified_since?: string;
  modified_till?: string;
  iccid?: string;
  imsi?: string;
  msisdn?: string;
  custom?: string[];
}

function tele2DefaultModifiedSince() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function listSims(p: ListSimsParams = {}): Promise<SimListOut> {
  const modifiedSince = p.provider === "tele2" && !p.modified_since
    ? tele2DefaultModifiedSince()
    : p.modified_since;
  const qs = new URLSearchParams();
  if (p.cursor) qs.set("cursor", p.cursor);
  if (p.limit) qs.set("limit", String(p.limit));
  if (p.provider) qs.set("provider", p.provider);
  if (p.status) qs.set("status", p.status);
  if (modifiedSince) qs.set("modified_since", modifiedSince);
  if (p.modified_till) qs.set("modified_till", p.modified_till);
  if (p.iccid) qs.set("iccid", p.iccid);
  if (p.imsi) qs.set("imsi", p.imsi);
  if (p.msisdn) qs.set("msisdn", p.msisdn);
  for (const c of p.custom ?? []) qs.append("custom", c);

  const q = qs.toString();
  return fetchApi<SimListOut>(`/sims${q ? `?${q}` : ""}`, { cache: "no-store" });
}

export async function getSim(iccid: string): Promise<SubscriptionOut> {
  return fetchApi<SubscriptionOut>(`/sims/${encodeURIComponent(iccid)}`, { cache: "no-store" });
}

export async function getUsage(iccid: string, qs?: string): Promise<UsageOut> {
  return fetchApi<UsageOut>(`/sims/${encodeURIComponent(iccid)}/usage${qs ? `?${qs}` : ""}`, { cache: "no-store" });
}

export async function getPresence(iccid: string): Promise<PresenceOut> {
  return fetchApi<PresenceOut>(`/sims/${encodeURIComponent(iccid)}/presence`, { cache: "no-store" });
}

export async function setSimStatus(
  iccid: string,
  body: StatusChangeIn,
  idempotencyKey: string
): Promise<void> {
  return fetchApi<void>(`/sims/${encodeURIComponent(iccid)}/status`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function purgeSim(iccid: string, idempotencyKey: string): Promise<void> {
  return fetchApi<void>(`/sims/${encodeURIComponent(iccid)}/purge`, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function importSims(body: SimImportIn): Promise<SimImportOut> {
  return fetchApi<SimImportOut>("/sims/import", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
