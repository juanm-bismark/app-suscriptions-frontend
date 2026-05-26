"use server";

import { fetchApi } from "@/lib/api-client";
import {
  SimListOutSchema,
  SubscriptionOutSchema,
  UsageOutSchema,
  PresenceOutSchema,
  LocationOutSchema,
  SimDetailsOutSchema,
  SimImportOutSchema,
  SimStatsOutSchema,
  SmsHistoryOutSchema,
  StatusHistoryOutSchema,
  SyncStatusOutSchema,
  SyncTriggerOutSchema,
  AsyncJobOutSchema,
} from "@/lib/api-validation";
import type {
  AsyncJobOut,
  PresenceOut,
  LocationOut,
  SimDetailsIn,
  SimDetailsOut,
  SimImportIn,
  SimImportOut,
  SimListOut,
  SimSearchIn,
  SimStatsOut,
  SmsHistoryOut,
  StatusHistoryOut,
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
  return listSimsAt("/sims", p);
}

export async function listAdminSims(p: ListSimsParams = {}): Promise<SimListOut> {
  return listSimsAt("/admin/sims", p);
}

async function listSimsAt(path: string, p: ListSimsParams = {}): Promise<SimListOut> {
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
  return fetchApi(`${path}${q ? `?${q}` : ""}`, { schema: SimListOutSchema, cache: "no-store" });
}

export async function searchSims(body: SimSearchIn): Promise<SimListOut> {
  return fetchApi("/sims/search", {
    method: "POST",
    body: JSON.stringify(body),
    schema: SimListOutSchema,
    cache: "no-store",
  });
}

export async function searchAdminSims(body: SimSearchIn): Promise<SimListOut> {
  return fetchApi("/admin/sims/search", {
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

export async function getLocation(iccid: string): Promise<LocationOut> {
  return fetchApi(`/sims/${encodeURIComponent(iccid)}/location`, { schema: LocationOutSchema, cache: "no-store" });
}

export async function getStatusHistory(
  iccid: string,
  params: { start_date?: string; end_date?: string } = {}
): Promise<StatusHistoryOut> {
  const qs = new URLSearchParams();
  if (params.start_date) qs.set("start_date", params.start_date);
  if (params.end_date) qs.set("end_date", params.end_date);
  const q = qs.toString();
  return fetchApi(`/sims/${encodeURIComponent(iccid)}/status-history${q ? `?${q}` : ""}`, {
    schema: StatusHistoryOutSchema,
    cache: "no-store",
  });
}

export async function getSmsHistory(
  iccid: string,
  params: { start_date?: string; end_date?: string } = {}
): Promise<SmsHistoryOut> {
  const qs = new URLSearchParams();
  if (params.start_date) qs.set("start_date", params.start_date);
  if (params.end_date) qs.set("end_date", params.end_date);
  const q = qs.toString();
  return fetchApi(`/sims/${encodeURIComponent(iccid)}/sms-history${q ? `?${q}` : ""}`, {
    schema: SmsHistoryOutSchema,
    cache: "no-store",
  });
}

export async function getSimStats(params: {
  provider?: Provider;
  status?: string;
  imei?: string;
  operator?: string;
  data_service?: boolean | null;
  sms_service?: boolean | null;
  last_lu_till?: string;
  custom?: string[];
} = {}): Promise<SimStatsOut> {
  return getSimStatsAt("/sims/stats", params);
}

export async function getAdminSimStats(params: {
  provider?: Provider;
  status?: string;
  imei?: string;
  operator?: string;
  data_service?: boolean | null;
  sms_service?: boolean | null;
  last_lu_till?: string;
  custom?: string[];
} = {}): Promise<SimStatsOut> {
  return getSimStatsAt("/admin/sims/stats", params);
}

async function getSimStatsAt(path: string, params: {
  provider?: Provider;
  status?: string;
  imei?: string;
  operator?: string;
  data_service?: boolean | null;
  sms_service?: boolean | null;
  last_lu_till?: string;
  custom?: string[];
} = {}): Promise<SimStatsOut> {
  const qs = new URLSearchParams();
  if (params.provider) qs.set("provider", params.provider);
  if (params.status) qs.set("status", params.status);
  if (params.imei) qs.set("imei", params.imei);
  if (params.operator) qs.set("operator", params.operator);
  if (params.data_service !== undefined && params.data_service !== null) qs.set("data_service", String(params.data_service));
  if (params.sms_service !== undefined && params.sms_service !== null) qs.set("sms_service", String(params.sms_service));
  if (params.last_lu_till) qs.set("last_lu_till", params.last_lu_till);
  for (const c of params.custom ?? []) qs.append("custom", c);
  const q = qs.toString();
  return fetchApi(`${path}${q ? `?${q}` : ""}`, {
    schema: SimStatsOutSchema,
    cache: "no-store",
  });
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
