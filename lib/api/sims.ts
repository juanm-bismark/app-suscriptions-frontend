"use server";

import { fetchApi } from "@/lib/api-client";
import {
  SimListOutSchema,
  SubscriptionOutSchema,
  UsageOutSchema,
  PresenceOutSchema,
  SimDetailsOutSchema,
  SimImportOutSchema,
  SyncStatusOutSchema,
  SyncTriggerOutSchema,
  AsyncJobOutSchema,
} from "@/lib/api-validation";
import type {
  AsyncJobOut,
  PresenceOut,
  SimDetailsIn,
  SimDetailsOut,
  SimImportIn,
  SimImportOut,
  SimListOut,
  SimSearchIn,
  StatusChangeIn,
  SyncStatusOut,
  SyncTriggerOut,
  SubscriptionOut,
  UsageOut,
} from "@/lib/types/api";
import type { Provider } from "@/lib/types/api/common";

export interface ListSimsParams {
  cursor?: string | null;
  limit?: number;
  provider?: Provider;
  status?: string;
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
  return fetchApi(`/sims${q ? `?${q}` : ""}`, { schema: SimListOutSchema, cache: "no-store" });
}

export async function searchSims(body: SimSearchIn): Promise<SimListOut> {
  return fetchApi("/sims/search", {
    method: "POST",
    body: JSON.stringify(body),
    schema: SimListOutSchema,
    cache: "no-store",
  });
}

export async function getSim(iccid: string): Promise<SubscriptionOut> {
  return fetchApi(`/sims/${encodeURIComponent(iccid)}`, { schema: SubscriptionOutSchema, cache: "no-store" });
}

export async function getUsage(iccid: string, qs?: string): Promise<UsageOut> {
  return fetchApi(`/sims/${encodeURIComponent(iccid)}/usage${qs ? `?${qs}` : ""}`, { schema: UsageOutSchema, cache: "no-store" });
}

export async function getPresence(iccid: string): Promise<PresenceOut> {
  return fetchApi(`/sims/${encodeURIComponent(iccid)}/presence`, { schema: PresenceOutSchema, cache: "no-store" });
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
  return fetchApi("/sims/import", {
    method: "POST",
    body: JSON.stringify(body),
    schema: SimImportOutSchema,
  });
}

export async function getSimDetails(body: SimDetailsIn): Promise<SimDetailsOut> {
  return fetchApi("/sims/details", {
    method: "POST",
    body: JSON.stringify(body),
    schema: SimDetailsOutSchema,
    cache: "no-store",
  });
}

export async function getSyncStatus(): Promise<SyncStatusOut> {
  return fetchApi("/sync/status", {
    schema: SyncStatusOutSchema,
    cache: "no-store",
  });
}

export async function triggerSync(provider: Provider): Promise<SyncTriggerOut> {
  return fetchApi(`/sync/trigger?provider=${encodeURIComponent(provider)}`, {
    method: "POST",
    schema: SyncTriggerOutSchema,
    cache: "no-store",
  });
}

export async function getJob(jobId: string): Promise<AsyncJobOut> {
  return fetchApi(`/jobs/${encodeURIComponent(jobId)}`, {
    schema: AsyncJobOutSchema,
    cache: "no-store",
  });
}
