"use client";

import { newIdempotencyKey } from "@/lib/api/idempotency";
import { getLocation, getPresence, getSmsHistory, getStatusHistory, getUsage, setSimStatus } from "@/lib/api/sims";
import { toast } from "@/components/ui";
import type { LocationOut, PresenceOut, ProviderCapabilitiesOut, SmsHistoryOut, SmsHistoryRecord, StatusHistoryOut, StatusHistoryRecord, SubscriptionOut, UsageControl, UsageOut } from "@/lib/types/api";
import { ROLES, type UserRole } from "@/lib/types/user";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { fmtDate, formatVal, looksMono, prettyKey } from "./data";
import { Btn, Icon, SourceBadge, StatusPillWithNative } from "./primitives";
import { SOURCES, T } from "./tokens";

type TabId = "detail" | "usage" | "presence" | "limits" | "actions";
type AsyncState<T> =
  | { status: "idle" | "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string; code?: string };

const TABS: { id: TabId; label: string }[] = [
  { id: "detail", label: "Resumen" },
  { id: "usage", label: "Consumo" },
  { id: "presence", label: "Presencia y red" },
  { id: "limits", label: "Límites" },
  { id: "actions", label: "Acciones" },
];

const VISIBLE_SIM_IDENTIFIER_KEYS = new Set(["iccid", "msisdn", "imsi", "imei", "eid", "euiccid"]);

function isTechnicalIdentifierField(key: string) {
  const raw = key.trim();
  const normalized = raw.toLowerCase();
  if (VISIBLE_SIM_IDENTIFIER_KEYS.has(normalized)) return false;
  return /(^|[_-])id($|[_-])|[a-z0-9]Id$|uuid|guid|company[_-]?code|account[_-]?id|sim[_-]?profile[_-]?id/i.test(raw);
}

function isUuidLikeValue(v: unknown) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
}

function value(v: string | null | undefined) {
  return v && v.trim() ? v : "—";
}

function clean(v: string | number | null | undefined) {
  const trimmed = v == null ? undefined : String(v).trim();
  return trimmed || undefined;
}

function providerString(subscription: SubscriptionOut, key: string): string | null {
  const raw = subscription.provider_fields?.[key];
  if (raw == null) return null;
  const text = String(raw).trim();
  return text || null;
}

function planDisplay(plan: SubscriptionOut["normalized"]["plan"]) {
  return clean(plan.name) ?? clean(plan.code) ?? clean(plan.id) ?? "—";
}

function subscriptionStatusInfo(subscription: SubscriptionOut) {
  const normalized = subscription.normalized.status;
  const providerStatus = clean(subscription.status) ?? "UNKNOWN";
  return {
    value: providerStatus,
    group: clean(normalized.group) ?? null,
  };
}

function bytesToDataLabel(bytes: string | number | null | undefined) {
  const n = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!n || Number.isNaN(n)) return "0 MB";
  const mb = n / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toLocaleString("es-CO", { maximumFractionDigits: 2 })} GB`;
  return `${mb.toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;
}

function mbToLabel(mb: number | null | undefined) {
  if (mb == null) return "Sin límite contractual";
  if (mb >= 1024) return `${(mb / 1024).toLocaleString("es-CO", { maximumFractionDigits: 2 })} GB`;
  return `${mb.toLocaleString("es-CO")} MB`;
}

function daysBetween(start: string, end: string) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 1;
  return Math.max(1, Math.ceil((b - a) / 86_400_000));
}

function errorMessage(err: unknown) {
  if (err && typeof err === "object") {
    const anyErr = err as { detail?: unknown; title?: unknown; message?: unknown; code?: unknown; extra?: unknown };
    const message = anyErr.detail || anyErr.title || anyErr.message;
    const extra = anyErr.extra && typeof anyErr.extra === "object" ? anyErr.extra as Record<string, unknown> : undefined;
    const retryAfter = extra?.retry_after;
    const retryText = anyErr.code === "provider.rate_limited" && retryAfter ? ` Intenta de nuevo en ${String(retryAfter)}.` : "";
    return {
      message: `${typeof message === "string" ? message : "No pudimos cargar estos datos."}${retryText}`,
      code: typeof anyErr.code === "string" ? anyErr.code : undefined,
    };
  }
  return { message: "No pudimos cargar estos datos.", code: undefined };
}

function metricNumber(v: string | number | null | undefined) {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function usageBars(usage: UsageOut) {
  const daily = usage.usage_metrics.filter((m) => /data.*daily|daily.*data/i.test(m.metric_type));
  const source = daily.length ? daily : usage.usage_metrics.filter((m) => /data/i.test(m.metric_type));
  const bars = source
    .map((m) => ({ label: m.metric_type.replace(/_/g, " "), value: metricNumber(m.usage) ?? 0, unit: m.unit ?? "" }))
    .filter((m) => m.value > 0);
  if (bars.length) return bars.slice(0, 30);

  const totalMb = (metricNumber(usage.data_used_bytes) ?? 0) / 1024 / 1024;
  return [{ label: "Periodo", value: totalMb, unit: "MB" }];
}

function mergedAttributes(subscription: SubscriptionOut) {
  return Object.entries({
    ...subscription.provider_fields,
    ...subscription.normalized.custom_fields,
  }).filter(([key, v]) => v !== undefined && !isTechnicalIdentifierField(key) && !isUuidLikeValue(v));
}

export function SubscriptionPage({
  subscription,
  capabilities,
  currentUserRole,
  initialTab = "detail",
}: {
  subscription: SubscriptionOut;
  capabilities: ProviderCapabilitiesOut;
  currentUserRole?: UserRole;
  initialTab?: TabId;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [copiedIccid, setCopiedIccid] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const src = SOURCES[subscription.provider];
  const n = subscription.normalized;
  const statusInfo = subscriptionStatusInfo(subscription);

  function refreshPage() {
    startRefreshTransition(() => router.refresh());
  }

  async function copyIccid() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(subscription.iccid);
      } else {
        const input = document.createElement("textarea");
        input.value = subscription.iccid;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setCopiedIccid(true);
      toast.success("ICCID copiado");
      window.setTimeout(() => setCopiedIccid(false), 1600);
    } catch {
      toast.error("No pudimos copiar el ICCID");
    }
  }

  return (
    <div style={{ background: T.pageBg, color: T.text, fontFamily: T.fontBody, minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* Breadcrumb bar */}
      <div style={{ padding: "10px 24px", background: T.cardBg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
        <Link
          href="/dashboard/subscriptions"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.headerBg, textDecoration: "none", fontWeight: 700 }}
        >
          <Icon.arrowLeft size={12} />
          Suscripciones
        </Link>
        <span style={{ color: T.muted }}>/</span>
        <span style={{ color: T.title, fontWeight: 600 }}>
          Suscripción
        </span>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" size="sm" icon={<Icon.copy size={12} />} onClick={copyIccid}>
          {copiedIccid ? "Copiado" : "Copiar ICCID"}
        </Btn>
      </div>

      {/* Hero section */}
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "20px 24px 0" }}>
        {/* Avatar + info + actions */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.7, fontWeight: 800, textTransform: "uppercase", marginBottom: 3 }}>Resumen operativo</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: 0 }}>
              Suscripción SIM
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {subscription.provider === "moabits" && (
              <Btn
                variant="ghost"
                size="md"
                icon={<Icon.download size={13} />}
                onClick={() => downloadProviderFields(subscription)}
              >
                Exportar data v2
              </Btn>
            )}
            <Btn
              variant="outline"
              size="md"
              icon={isRefreshing ? <Loader2 size={13} className="animate-spin" /> : <Icon.refresh size={13} />}
              onClick={refreshPage}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Sincronizando..." : "Sincronizar"}
            </Btn>
            <Btn variant="primary" size="md" color={src.color} onClick={() => setTab("actions")}>
              Acciones
            </Btn>
          </div>
        </div>

        {/* Canonical summary strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 1, background: T.border, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
          <SummaryField label="Fuente">
            <SourceBadge source={subscription.provider} size="sm" withName />
          </SummaryField>
          <SummaryField label="Estado">
            <StatusPillWithNative
              provider={subscription.provider}
              status={statusInfo.value}
              nativeStatus={statusInfo.value}
              displayLabel={statusInfo.value}
              statusGroup={statusInfo.group}
              showContext={false}
              size="sm"
            />
          </SummaryField>
          <SummaryField label="ICCID" mono preserveValue>{subscription.iccid}</SummaryField>
          <SummaryField label="MSISDN" mono>{value(subscription.msisdn)}</SummaryField>
          <SummaryField label="IMSI" mono>{value(subscription.imsi)}</SummaryField>
          <SummaryField label="Plan" sub={clean(n.plan.name) ? clean(n.plan.code) ?? clean(n.plan.id) : undefined}>{planDisplay(n.plan)}</SummaryField>
          <SummaryField label="Activado">{fmtDate(subscription.activated_at)}</SummaryField>
          <SummaryField label="Actualizado">{fmtDate(subscription.updated_at)}</SummaryField>
        </div>

        {/* Underline tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: -1 }}>
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                padding: "11px 16px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === item.id ? src.color : "transparent"}`,
                color: tab === item.id ? T.title : T.muted,
                fontFamily: T.fontBody,
                fontSize: 13,
                fontWeight: tab === item.id ? 700 : 500,
                cursor: "pointer",
                letterSpacing: -0.1,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: 24 }}>
        {tab === "detail" && <DetailTab subscription={subscription} capabilities={capabilities} />}
        {tab === "usage" && <UsageTab subscription={subscription} />}
        {tab === "presence" && <PresenceTab subscription={subscription} capabilities={capabilities} />}
        {tab === "limits" && <LimitsTab subscription={subscription} />}
        {tab === "actions" && (
          <ActionsTab
            subscription={subscription}
            capabilities={capabilities}
            currentUserRole={currentUserRole}
          />
        )}
      </div>
    </div>
  );
}

function SummaryField({
  label,
  children,
  sub,
  mono,
  preserveValue,
}: {
  label: string;
  children: React.ReactNode;
  sub?: string;
  mono?: boolean;
  preserveValue?: boolean;
}) {
  return (
    <div style={{ background: T.cardBg, padding: "12px 16px" }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: T.title,
          letterSpacing: -0.2,
          overflow: preserveValue ? "visible" : "hidden",
          textOverflow: preserveValue ? "clip" : "ellipsis",
          whiteSpace: preserveValue ? "normal" : "nowrap",
          overflowWrap: preserveValue ? "anywhere" : undefined,
          lineHeight: preserveValue ? 1.35 : undefined,
          fontFamily: mono ? T.fontMono : T.fontBody,
        }}
      >
        {children}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

type DetailRow = { label: string; value: string; mono?: boolean; sub?: string; dot?: string };

function DetailTab({
  subscription,
  capabilities,
}: {
  subscription: SubscriptionOut;
  capabilities: ProviderCapabilitiesOut;
}) {
  const providerName = SOURCES[subscription.provider].name;
  const n = subscription.normalized;
  const attrs = mergedAttributes(subscription);
  const canStatusHistory = capabilities.capabilities.status_history?.status === "supported";
  const secondaryIdentityRows = [
    { label: "IMEI", value: value(n.identity.imei), mono: true },
    { label: "Alias", value: value(n.identity.alias) },
    { label: "EID", value: value(n.identity.eid), mono: true },
    { label: "eUICCID", value: value(n.identity.euiccid), mono: true },
    { label: "SIM profile", value: value(n.identity.sim_profile_id), mono: true },
  ].filter((row) => row.value !== "—");
  const planRows = [
    { label: "Nombre", value: value(n.plan.name) },
    { label: "Código", value: value(n.plan.code), mono: true },
    { label: "ID", value: formatVal(n.plan.id), mono: true },
    { label: "Communication plan", value: value(n.plan.communication_plan) },
    { label: "APN", value: value(n.plan.apn), mono: true },
    { label: "APNs", value: formatVal(n.plan.apns), mono: true },
    { label: "Inicio", value: fmtDate(n.plan.started_at) },
    { label: "Expira", value: fmtDate(n.plan.expires_at) },
  ].filter((row) => row.value !== "—");
  const dateRows = [
    { label: "Agregado", value: fmtDate(n.dates.added_at) },
    { label: "Provisionado", value: fmtDate(n.dates.provisioned_at) },
  ].filter((row) => row.value !== "—");

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {secondaryIdentityRows.length > 0 && (
        <Card title="Identificadores secundarios">
          <FieldGrid rows={secondaryIdentityRows} />
        </Card>
      )}

      <Card title="Plan">
        {planRows.length ? <FieldGrid rows={planRows} /> : <Empty text="Este proveedor no envió información de plan." />}
      </Card>

      <Card title="Cliente">
        <FieldGrid rows={[
          { label: "Nombre", value: value(n.customer.name) },
          { label: "ID", value: value(n.customer.id), mono: true },
          { label: "Company code", value: value(n.customer.company_code), mono: true },
          { label: "Account ID", value: value(n.customer.account_id), mono: true },
        ]} />
      </Card>

      <Card title="Red">
        <FieldGrid rows={[
          { label: "Operador", value: value(n.network.operator) },
          { label: "País", value: value(n.network.country), mono: true },
          { label: "RAT", value: value(n.network.rat_type), mono: true },
          { label: "Última red", value: value(n.network.last_network) },
          { label: "IMSI conectividad", value: value(providerString(subscription, "connectivity_imsi_raw")), mono: true },
          { label: "IP actual/sesión", value: value(n.network.ip_address), mono: true },
          { label: "IPv6 actual/sesión", value: value(n.network.ipv6_address), mono: true },
          { label: "IP fija", value: value(n.network.fixed_ip_address), mono: true },
          { label: "IPv6 fija", value: value(n.network.fixed_ipv6_address), mono: true },
          { label: "IPs estáticas", value: formatVal(n.network.static_ips), mono: true },
          { label: "IPs estáticas adicionales", value: formatVal(n.network.additional_static_ips), mono: true },
          { label: "Estado GPRS", value: formatVal(n.network.gprs_status) },
          { label: "Estado servicio IP", value: formatVal(n.network.ip_status) },
          { label: "SGSN IP", value: value(n.network.sgsn_ip), mono: true },
          { label: "GGSN IP", value: value(n.network.ggsn_ip), mono: true },
          { label: "Ubicación", value: formatVal(n.network.location) },
          { label: "Último tráfico", value: fmtDate(n.network.last_traffic_at) },
          { label: "Primer LU", value: fmtDate(n.network.first_lu_at) },
          { label: "Último LU", value: fmtDate(n.network.last_lu_at) },
          { label: "Primer CDR", value: fmtDate(n.network.first_cdr_at) },
          { label: "Último CDR", value: fmtDate(n.network.last_cdr_at) },
          { label: "CDR mes", value: fmtDate(providerString(subscription, "firstcdrmonth")) },
        ]} />
      </Card>

      <Card title="Hardware">
        <FieldGrid rows={[
          { label: "Modelo SIM", value: value(n.hardware.sim_model) },
          { label: "Fabricante módulo", value: value(n.hardware.module_manufacturer) },
          { label: "Modelo módulo", value: value(n.hardware.module_model) },
          { label: "Device ID", value: value(n.hardware.device_id), mono: true },
          { label: "Modem ID", value: value(n.hardware.modem_id), mono: true },
          { label: "Cambio IMEI", value: fmtDate(n.hardware.imei_last_changed_at) },
          { label: "Despachado", value: fmtDate(n.hardware.shipped_at) },
        ]} />
      </Card>

      <Card title="Servicios">
        <FieldGrid rows={[
          { label: "Activos", value: formatVal(n.services.active) },
          { label: "Básicos", value: formatVal(n.services.basic) },
          { label: "Suplementarios", value: formatVal(n.services.supplementary) },
          { label: "Datos", value: formatVal(n.services.data_service) },
          { label: "SMS", value: formatVal(n.services.sms_service) },
        ]} />
      </Card>

      <Card title="Límites">
        <FieldGrid rows={[
          { label: "Datos", value: mbToLabel(n.limits.data) },
          { label: "SMS", value: n.limits.sms == null ? "Sin límite contractual" : n.limits.sms.toLocaleString("es-CO") },
          { label: "Controles diarios", value: Object.keys(n.limits.daily ?? {}).length.toLocaleString("es-CO") },
          { label: "Controles mensuales", value: Object.keys(n.limits.monthly ?? {}).length.toLocaleString("es-CO") },
        ]} />
      </Card>

      {dateRows.length > 0 && (
        <Card title="Fechas">
          <FieldGrid rows={dateRows} />
        </Card>
      )}

      {canStatusHistory && <StatusHistoryCard subscription={subscription} />}

      <Card title={`Campos avanzados · ${providerName}`}>
        {attrs.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {attrs.map(([k, v]) => <KV key={k} label={prettyKey(k)} value={formatVal(v)} mono={looksMono(k)} />)}
          </div>
        ) : (
          <Empty text="Sin atributos adicionales." />
        )}
      </Card>
    </div>
  );
}

function FieldGrid({ rows }: { rows: DetailRow[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
      {rows.map((row) => (
        <KV key={row.label} label={row.label} value={row.value} mono={row.mono} sub={row.sub} dot={row.dot} />
      ))}
    </div>
  );
}

function UsageTab({ subscription }: { subscription: SubscriptionOut }) {
  // Moabits rechaza explícitamente cualquier filtro `metrics` (UnsupportedOperation).
  // Kite y Tele2 sí lo soportan.
  const metricsQs = subscription.provider === "moabits" ? undefined : "metrics=data";
  const state = useUsage(subscription.iccid, metricsQs);
  if (state.status === "error") return <Card title="Consumo"><Empty text={state.message} /></Card>;
  if (state.status !== "success") return <Card title="Consumo"><Empty text="Cargando consumo desde el proveedor..." /></Card>;

  const usage = state.data;
  const totalBytes = metricNumber(usage.data_used_bytes) ?? 0;
  const days = daysBetween(usage.period_start, usage.period_end);
  const bars = usageBars(usage);
  const peak = Math.max(...bars.map((b) => b.value), 0);
  const hasSms = usage.sms_count > 0 || usage.usage_metrics.some((m) => /sms/i.test(m.metric_type));
  const hasVoice = usage.voice_seconds > 0 || usage.usage_metrics.some((m) => /voice|voz/i.test(m.metric_type));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="KPIs de consumo">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <KV label="Datos consumidos" value={bytesToDataLabel(usage.data_used_bytes)} />
          <KV label="Cap del plan" value={mbToLabel(subscription.normalized.limits.data)} />
          <KV label="Promedio diario" value={bytesToDataLabel(totalBytes / days)} />
          {peak > 0 && <KV label="Pico diario" value={`${peak.toLocaleString("es-CO", { maximumFractionDigits: 1 })} ${bars[0]?.unit || "MB"}`} />}
        </div>
      </Card>
      <Card title={`Periodo · ${fmtDate(usage.period_start)} a ${fmtDate(usage.period_end)}`}>
        <BarChart bars={bars} />
      </Card>
      {(hasSms || hasVoice) && (
        <Card title="Otros consumos">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            {hasSms && <KV label="SMS" value={usage.sms_count.toLocaleString("es-CO")} />}
            {hasVoice && <KV label="Voz" value={`${Math.round(usage.voice_seconds / 60).toLocaleString("es-CO")} min`} />}
          </div>
        </Card>
      )}
    </div>
  );
}

function PresenceTab({
  subscription,
  capabilities,
}: {
  subscription: SubscriptionOut;
  capabilities: ProviderCapabilitiesOut;
}) {
  const state = usePresence(subscription.iccid);
  const isMoabits = subscription.provider === "moabits";
  const canSmsHistory = capabilities.capabilities.sms_history?.status === "supported";
  const canLocation = capabilities.capabilities.location?.status === "supported";

  if (state.status === "error") {
    const unsupported = state.code === "provider.unsupported_operation";
    return <Card title="Presencia y red"><Empty text={unsupported ? "Este proveedor no expone presencia para la SIM." : state.message} /></Card>;
  }
  if (state.status !== "success") return <Card title="Presencia y red"><Empty text="Consultando presencia..." /></Card>;
  const p = state.data;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Presencia y red">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <KV label="Estado" value={p.state} dot={presenceColor(p.state)} />
          <KV label="Última vez vista" value={fmtDate(p.last_seen_at)} />
          <KV label="País" value={value(p.country_code)} mono />
          <KV label="Red" value={value(p.network_name)} />
          <KV label="RAT" value={value(p.rat_type)} mono />
          <KV label="IP" value={value(p.ip_address)} mono />
        </div>
      </Card>
      {canLocation && <LocationCard subscription={subscription} />}
      {isMoabits && <MoabitsConnectivityCard subscription={subscription} />}
      {canSmsHistory && <SmsHistoryCard subscription={subscription} />}
    </div>
  );
}

function LocationCard({ subscription }: { subscription: SubscriptionOut }) {
  const state = useSimLocation(subscription.iccid);
  if (state.status === "error") return <Card title="Ubicación"><Empty text={state.message} /></Card>;
  if (state.status !== "success") return <Card title="Ubicación"><Empty text="Consultando ubicación..." /></Card>;
  const loc = state.data;
  const hasCoords = loc.latitude != null && loc.longitude != null;
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}` : null;
  return (
    <Card title="Ubicación">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <KV label="Latitud" value={formatVal(loc.latitude)} mono />
        <KV label="Longitud" value={formatVal(loc.longitude)} mono />
        <KV label="Fuente" value={value(loc.source)} />
        <KV label="Actualizada" value={fmtDate(loc.timestamp)} />
      </div>
      {mapsUrl && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.divider}` }}>
          <Link href={mapsUrl} target="_blank" rel="noreferrer" style={{ color: T.headerBg, fontWeight: 700, fontSize: 13 }}>
            Ver en mapa
          </Link>
        </div>
      )}
    </Card>
  );
}

function SmsHistoryCard({ subscription }: { subscription: SubscriptionOut }) {
  const [state, setState] = useState<AsyncState<SmsHistoryOut>>({ status: "loading" });
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    setState({ status: "loading" });
    getSmsHistory(subscription.iccid).then(
      (data) => setState({ status: "success", data }),
      (err) => {
        const e = errorMessage(err);
        setState({ status: "error", ...e });
      }
    );
  }, [subscription.iccid]);

  useEffect(() => { load(); }, [load]);

  const lastMo = state.status === "success"
    ? state.data.records.find((r) => r.sms_type === "MO")
    : undefined;
  const lastMt = state.status === "success"
    ? state.data.records.find((r) => r.sms_type === "MT")
    : undefined;

  const moLabel = lastMo ? fmtDate(lastMo.date) : "Sin MO en el periodo";
  const mtLabel = lastMt ? fmtDate(lastMt.date) : "Sin MT en el periodo";
  const deliveryLabel = lastMt
    ? `GW ${lastMt.gateway_delivered === true ? "✓" : lastMt.gateway_delivered === false ? "✗" : "—"} · SC ${lastMt.sms_center_delivered === true ? "✓" : lastMt.sms_center_delivered === false ? "✗" : "—"}`
    : "Sin MT en el periodo";

  return (
    <>
      <Card title="Mensajería">
        {state.status === "error" ? (
          <Empty text={state.message} />
        ) : state.status !== "success" ? (
          <Empty text="Cargando historial SMS..." />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
              <KV label="Último SMS recibido (MO)" value={moLabel} sub={lastMo ? truncate(lastMo.message, 60) : undefined} />
              <KV label="Último SMS enviado (MT)" value={mtLabel} sub={lastMt ? truncate(lastMt.message, 60) : undefined} />
              <KV label="Delivery último MT" value={deliveryLabel} mono />
              <KV label="Total registros" value={state.data.records.length.toLocaleString("es-CO")} sub={`Periodo: ${fmtDate(state.data.period_start)} a ${fmtDate(state.data.period_end)}`} />
            </div>
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.divider}`, display: "flex", gap: 8 }}>
              <Btn variant="primary" size="sm" icon={<Icon.refresh size={12} />} onClick={() => setShowModal(true)}>
                Ver historial SMS
              </Btn>
              <Btn variant="ghost" size="sm" onClick={load}>
                Refrescar
              </Btn>
            </div>
          </>
        )}
      </Card>
      {showModal && state.status === "success" && (
        <SmsHistoryModal data={state.data} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function StatusHistoryCard({ subscription }: { subscription: SubscriptionOut }) {
  const [state, setState] = useState<AsyncState<StatusHistoryOut>>({ status: "loading" });
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    setState({ status: "loading" });
    getStatusHistory(subscription.iccid).then(
      (data) => setState({ status: "success", data }),
      (err) => {
        const e = errorMessage(err);
        setState({ status: "error", ...e });
      }
    );
  }, [subscription.iccid]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card title="Historial de estados">
      {state.status === "error" ? (
        <Empty text={state.message} />
      ) : state.status !== "success" ? (
        <Empty text="Cargando historial de estados..." />
      ) : state.data.records.length === 0 ? (
        <Empty text="Sin cambios de estado en el periodo." />
      ) : (
        <>
          <div style={{ display: "grid" }}>
            {state.data.records.slice(0, 8).map((record, index) => (
              <StatusHistoryRow key={`${record.time}-${index}`} record={record} />
            ))}
          </div>
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.divider}`, display: "flex", gap: 8 }}>
            <Btn variant="primary" size="sm" icon={<Icon.refresh size={12} />} onClick={() => setShowModal(true)}>
              Ver historial completo
            </Btn>
            <Btn variant="ghost" size="sm" onClick={load}>
              Refrescar
            </Btn>
          </div>
        </>
      )}
      {showModal && state.status === "success" && (
        <StatusHistoryModal data={state.data} onClose={() => setShowModal(false)} />
      )}
    </Card>
  );
}

function StatusHistoryRow({ record }: { record: StatusHistoryRecord }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, padding: "10px 16px", borderTop: `1px solid ${T.divider}` }}>
      <div style={{ fontFamily: T.fontMono, color: T.muted, fontSize: 12 }}>{fmtDate(record.time)}</div>
      <div>
        <div style={{ color: T.title, fontWeight: 750, fontSize: 13 }}>{record.state}</div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>
          {record.automatic ? "Automático" : "Manual"}{record.reason ? ` · ${record.reason}` : ""}{record.user ? ` · ${record.user}` : ""}
        </div>
      </div>
    </div>
  );
}

function StatusHistoryModal({ data, onClose }: { data: StatusHistoryOut; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.42)", display: "grid", placeItems: "center", padding: 18 }}>
      <div style={{ width: "min(860px, 100%)", maxHeight: "min(86vh, 720px)", background: T.cardBg, borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: "0 24px 80px rgba(15,23,42,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0, color: T.title, fontSize: 16, flex: 1 }}>Historial de estados</h3>
          <span style={{ fontSize: 12, color: T.muted }}>
            ICCID <span style={{ fontFamily: T.fontMono }}>{data.iccid}</span> · {data.records.length.toLocaleString("es-CO")} cambios
          </span>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: "0 6px" }}>×</button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {data.records.length === 0 ? (
            <Empty text="Sin cambios de estado en el periodo." />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cardBg, zIndex: 1 }}>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={smsTh}>Fecha</th>
                  <th style={smsTh}>Estado</th>
                  <th style={smsTh}>Origen</th>
                  <th style={smsTh}>Motivo</th>
                  <th style={smsTh}>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record, index) => (
                  <tr key={`${record.time}-${index}`}>
                    <td style={{ ...smsTd, fontFamily: T.fontMono, whiteSpace: "nowrap" }}>{fmtDate(record.time)}</td>
                    <td style={{ ...smsTd, fontWeight: 700 }}>{record.state}</td>
                    <td style={smsTd}>{record.automatic ? "Automático" : "Manual"}</td>
                    <td style={smsTd}>{record.reason || "—"}</td>
                    <td style={smsTd}>{record.user || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SmsHistoryModal({ data, onClose }: { data: SmsHistoryOut; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.42)", display: "grid", placeItems: "center", padding: 18 }}>
      <div style={{ width: "min(860px, 100%)", maxHeight: "min(86vh, 720px)", background: T.cardBg, borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: "0 24px 80px rgba(15,23,42,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0, color: T.title, fontSize: 16, flex: 1 }}>Historial SMS</h3>
          <span style={{ fontSize: 12, color: T.muted }}>
            ICCID <span style={{ fontFamily: T.fontMono }}>{data.iccid}</span> · {data.records.length.toLocaleString("es-CO")} registros
          </span>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: "0 6px" }}>×</button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {data.records.length === 0 ? (
            <Empty text={`Sin SMS entre ${fmtDate(data.period_start)} y ${fmtDate(data.period_end)}.`} />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: T.cardBg, zIndex: 1 }}>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={smsTh}>Fecha</th>
                  <th style={smsTh}>Tipo</th>
                  <th style={smsTh}>Mensaje</th>
                  <th style={smsTh}>GW</th>
                  <th style={smsTh}>SC</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r, i) => <SmsRow key={`${r.date}-${i}`} record={r} />)}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const smsTh: React.CSSProperties = { textAlign: "left", padding: "8px 12px", color: T.muted, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700 };
const smsTd: React.CSSProperties = { padding: "8px 12px", color: T.text, borderBottom: `1px solid ${T.divider}`, verticalAlign: "top" };

function SmsRow({ record }: { record: SmsHistoryRecord }) {
  const typeColor = record.sms_type === "MO" ? T.success : T.headerBg;
  return (
    <tr>
      <td style={{ ...smsTd, fontFamily: T.fontMono, whiteSpace: "nowrap" }}>{fmtDate(record.date)}</td>
      <td style={{ ...smsTd, fontWeight: 700, color: typeColor }}>{record.sms_type}</td>
      <td style={{ ...smsTd, maxWidth: 380, wordBreak: "break-word" }}>{record.message || "—"}</td>
      <td style={{ ...smsTd, fontFamily: T.fontMono }}>{deliveryGlyph(record.gateway_delivered)}</td>
      <td style={{ ...smsTd, fontFamily: T.fontMono }}>{deliveryGlyph(record.sms_center_delivered)}</td>
    </tr>
  );
}

function deliveryGlyph(v: boolean | null): string {
  if (v === true) return "✓";
  if (v === false) return "✗";
  return "—";
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function downloadProviderFields(subscription: SubscriptionOut) {
  try {
    const payload = {
      iccid: subscription.iccid,
      provider: subscription.provider,
      updated_at: subscription.updated_at,
      detail_level: subscription.detail_level,
      provider_fields: subscription.provider_fields,
      normalized: subscription.normalized,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subscription.provider}-${subscription.iccid}-v2.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Data v2 descargada.");
  } catch {
    toast.error("No pudimos exportar la data.");
  }
}

function MoabitsConnectivityCard({ subscription }: { subscription: SubscriptionOut }) {
  const n = subscription.normalized;
  const operator = clean(n.network.operator);
  const country = clean(n.network.country);
  const rat = clean(n.network.rat_type);
  const ip = clean(n.network.ip_address);
  const imsiConn = providerString(subscription, "connectivity_imsi_raw");
  const mcc = providerString(subscription, "mcc");
  const mnc = providerString(subscription, "mnc");
  const sessionStarted = providerString(subscription, "session_started_at");
  const usageKb = providerString(subscription, "usage_kb");
  const chargeTowards = providerString(subscription, "charge_towards");
  const dataSessionId = providerString(subscription, "data_session_id");
  const enrichmentStatus = providerString(subscription, "enrichment_status");

  const hasAny = operator || country || rat || ip || imsiConn || mcc || mnc ||
                 sessionStarted || usageKb || chargeTowards || dataSessionId;

  if (!hasAny) {
    return (
      <Card title="Connectivity status (Moabits v2)">
        <Empty text="Enrichment v2 sin datos para esta SIM. Puede estar en `v1_only`." />
      </Card>
    );
  }

  return (
    <Card title="Connectivity status (Moabits v2)">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <KV label="Operador" value={value(operator)} />
        <KV label="País" value={value(country)} mono />
        <KV label="RAT" value={value(rat)} mono />
        <KV label="IP privada" value={value(ip)} mono />
        <KV label="IMSI conectividad" value={value(imsiConn)} mono />
        <KV label="MCC / MNC" value={mcc || mnc ? `${value(mcc)} / ${value(mnc)}` : "—"} mono />
        <KV label="Inicio sesión datos" value={fmtDate(sessionStarted)} />
        <KV label="Tráfico sesión (KB)" value={value(usageKb)} mono />
        <KV label="Charge towards" value={value(chargeTowards)} mono />
        <KV label="Data session ID" value={value(dataSessionId)} mono />
        <KV label="Actualizado" value={fmtDate(subscription.updated_at)} />
        <KV label="Enrichment" value={value(enrichmentStatus)} sub="full · detail_only · connectivity_only · v1_only" />
      </div>
    </Card>
  );
}

function LimitsTab({ subscription }: { subscription: SubscriptionOut }) {
  const limits = subscription.normalized.limits;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Límites contractuales">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <KV label="Datos por SIM" value={mbToLabel(limits.data)} />
          <KV label="SMS por SIM" value={limits.sms == null ? "Sin límite contractual" : limits.sms.toLocaleString("es-CO")} />
        </div>
      </Card>
      <LimitGroup title="Controles diarios" controls={limits.daily} />
      <LimitGroup title="Controles mensuales" controls={limits.monthly} />
    </div>
  );
}

type PendingAction =
  | { kind: "status"; target: string; dataService: boolean; smsService: boolean; idempotencyKey: string }
  | { kind: "purge"; confirmText: string; idempotencyKey: string };

function actionErrorMessage(err: unknown) {
  const parsed = errorMessage(err);
  return parsed.message || "No pudimos ejecutar la acción.";
}

function purgeBodyFor(provider: SubscriptionOut["provider"]) {
  if (provider === "kite") {
    return "Ejecuta networkReset en Kite. Reinicia la sesión y la IP, pero no cambia el estado.";
  }
  if (provider === "tele2") {
    return "Acción destructiva. Transiciona la SIM a PURGED en Tele2. Estado terminal, no reversible.";
  }
  return "Acción destructiva. Marca la SIM como purgada en Moabits. Permanente, no se puede deshacer.";
}

function ActionsTab({
  subscription,
  capabilities,
  currentUserRole,
}: {
  subscription: SubscriptionOut;
  capabilities: ProviderCapabilitiesOut;
  currentUserRole?: UserRole;
}) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const src = SOURCES[subscription.provider];
  const isAdmin = currentUserRole === ROLES.ADMIN;
  const statusCapability = capabilities.capabilities.set_administrative_status;
  const targets = useMemo(() => statusCapability?.targets ?? [], [statusCapability?.targets]);
  const currentStatus = subscriptionStatusInfo(subscription);
  const purgeCapability = capabilities.capabilities.purge;
  const canPurge = purgeCapability?.status === "supported";
  const canChangeStatus = statusCapability?.status === "supported" && targets.length > 0;

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [selectedTarget, setSelectedTarget] = useState(targets[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [awaitingSync, setAwaitingSync] = useState(false);

  // Disparo el toast cuando la transición de refresh termina, no antes — así el
  // usuario sabe que la consulta al provider concluyó y los datos en pantalla son frescos.
  useEffect(() => {
    if (awaitingSync && !isRefreshing) {
      setAwaitingSync(false);
      toast.success(`Datos refrescados desde ${src.name}.`);
    }
  }, [awaitingSync, isRefreshing, src.name]);
  const effectiveTarget = targets.includes(selectedTarget) ? selectedTarget : targets[0] ?? "";

  const isMoabitsServiceTarget =
    subscription.provider === "moabits" &&
    pending?.kind === "status" &&
    (pending.target.toLowerCase() === "active" || pending.target.toLowerCase() === "suspended");
  const servicesValid = !isMoabitsServiceTarget || (pending?.kind === "status" && (pending.dataService || pending.smsService));
  const purgeConfirmValid = pending?.kind !== "purge" || pending.confirmText === subscription.iccid;

  // Build action rows from capabilities
  type ActionKey = "sync" | "purge";
  interface ActionDef { key: ActionKey; title: string; body: string; color: string; danger: boolean; icon: React.ReactNode }

  const actionDefs: ActionDef[] = [
    {
      key: "sync" as ActionKey,
      title: "Sincronizar desde fuente",
      body: `Refresca los datos consultando ${src.name} en tiempo real.`,
      color: src.color,
      danger: false,
      icon: <Icon.refresh size={13} />,
    },
    ...(canPurge ? [{
      key: "purge" as ActionKey,
      title: "Purgar línea",
      body: purgeBodyFor(subscription.provider),
      color: T.danger,
      danger: true,
      icon: <Icon.close size={12} />,
    }] : []),
  ];

  if (!isAdmin) {
    return (
      <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, color: T.title, fontWeight: 800, fontSize: 13 }}>Acciones</div>
        <div style={{ padding: 16 }}>
          <div role="note" style={{ border: `1px solid ${T.warning}`, background: "#FBEFD4", color: "#7A4E0B", borderRadius: 6, padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>
            Solo un administrador puede ejecutar cambios de estado o purgas.
          </div>
        </div>
      </section>
    );
  }

  function handleClick(key: ActionKey) {
    if (key === "purge") {
      setPending({ kind: "purge", confirmText: "", idempotencyKey: newIdempotencyKey() });
    } else {
      setAwaitingSync(true);
      startRefreshTransition(() => router.refresh());
    }
  }

  function beginStatusChange() {
    if (!canChangeStatus || !effectiveTarget) return;
    setPending({
      kind: "status",
      target: effectiveTarget,
      dataService: subscription.normalized.services.data_service ?? true,
      smsService: subscription.normalized.services.sms_service ?? true,
      idempotencyKey: newIdempotencyKey(),
    });
  }

  async function submitAction() {
    if (!pending || busy || !servicesValid || !purgeConfirmValid) return;
    setBusy(true);
    try {
      if (pending.kind === "status") {
        await setSimStatus(
          subscription.iccid,
          {
            target: pending.target,
            data_service: isMoabitsServiceTarget ? pending.dataService : undefined,
            sms_service: isMoabitsServiceTarget ? pending.smsService : undefined,
          },
          pending.idempotencyKey
        );
        toast.success(`Estado enviado: ${pending.target}.`);
        setPending(null);
        router.refresh();
      } else {
        // Purge is intentionally mocked — do NOT call the backend from the UI.
        console.warn("[MOCK] Purga simulada. No se envio ninguna solicitud al backend.", {
          iccid: subscription.iccid,
          provider: subscription.provider,
          endpoint: `/v1/sims/${subscription.iccid}/purge`,
          idempotencyKey: pending.idempotencyKey,
        });
        toast.warning("Mock: purga simulada. No se envio ninguna solicitud.");
        setPending(null);
      }
    } catch (err) {
      toast.error(actionErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 3, height: 14, background: src.color, borderRadius: 2, flexShrink: 0 }} />
          <div style={{ color: T.title, fontWeight: 800, fontSize: 13, flex: 1 }}>Acciones disponibles</div>
          <span style={{ fontSize: 11, color: T.muted }}>
            estado: <strong style={{ color: T.title, fontFamily: T.fontMono }}>{currentStatus.value}</strong>
          </span>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {canChangeStatus ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                background: T.cardBg,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, background: src.color + "22", color: src.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon.chev size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.title, letterSpacing: 0 }}>Cambiar estado</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>
                  Estados permitidos por {src.name}.
                </div>
              </div>
              <select
                value={effectiveTarget}
                onChange={(event) => setSelectedTarget(event.target.value)}
                style={{
                  minWidth: 170,
                  border: `1px solid ${T.border}`,
                  background: "#fff",
                  color: T.text,
                  borderRadius: 5,
                  padding: "7px 9px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: T.fontMono,
                }}
              >
                {targets.map((target) => (
                  <option key={target} value={target}>{target}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={beginStatusChange}
                disabled={!effectiveTarget}
                style={{
                  border: `1px solid ${T.border}`,
                  background: "#fff",
                  color: effectiveTarget ? T.text : T.muted,
                  borderRadius: 5,
                  padding: "7px 10px",
                  cursor: effectiveTarget ? "pointer" : "not-allowed",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: T.fontBody,
                }}
              >
                Cambiar
              </button>
            </div>
          ) : statusCapability?.status && statusCapability.status !== "supported" ? (
            <div role="note" style={{ border: `1px solid ${T.warning}66`, background: "#FBEFD4", color: "#7A4E0B", borderRadius: 6, padding: "10px 12px", fontSize: 12.5, fontWeight: 700 }}>
              Cambio de estado no disponible: {statusCapability.reason ?? statusCapability.status}.
            </div>
          ) : null}
          {actionDefs.length === 0 && !canChangeStatus && <Empty text="Sin acciones disponibles para este proveedor." />}
          {actionDefs.map((a) => (
            <div
              key={a.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                border: `1px solid ${a.danger ? T.danger + "55" : T.border}`,
                borderRadius: 6,
                background: a.danger ? "#FFF5F2" : T.cardBg,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 6, background: a.color + "22", color: a.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {a.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.title, letterSpacing: -0.1 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{a.body}</div>
              </div>
              <button
                type="button"
                onClick={() => handleClick(a.key)}
                disabled={a.key === "sync" && isRefreshing}
                aria-busy={a.key === "sync" && isRefreshing || undefined}
                style={{
                  border: `1px solid ${a.danger ? T.danger + "66" : T.border}`,
                  background: "#fff",
                  color: a.danger ? T.danger : T.text,
                  borderRadius: 5,
                  padding: "5px 10px",
                  cursor: a.key === "sync" && isRefreshing ? "wait" : "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: T.fontBody,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: a.key === "sync" && isRefreshing ? 0.72 : 1,
                }}
              >
                {a.key === "sync" && isRefreshing && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
                {a.danger ? "Confirmar…" : isRefreshing ? "Ejecutando..." : "Ejecutar"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Confirmation dialog */}
      {pending && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15, 23, 42, 0.42)", display: "grid", placeItems: "center", padding: 18 }}>
          <div style={{ width: "min(520px, 100%)", background: T.cardBg, borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)", overflow: "hidden" }}>
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.divider}` }}>
              <h3 style={{ margin: 0, color: T.title, fontSize: 16 }}>
                {pending.kind === "status" ? "Confirmar cambio de estado" : "Confirmar purga"}
              </h3>
              <p style={{ margin: "6px 0 0", color: T.muted, fontSize: 13 }}>
                ICCID <span style={{ fontFamily: T.fontMono }}>{subscription.iccid}</span>
              </p>
            </div>
            <div style={{ padding: 18, display: "grid", gap: 14 }}>
              {pending.kind === "status" ? (
                <>
                  <p style={{ margin: 0, color: T.text, fontSize: 14 }}>
                    Enviar cambio a <span style={{ fontFamily: T.fontMono, fontWeight: 800 }}>{pending.target}</span> en {src.name}.
                  </p>
                  {isMoabitsServiceTarget && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, color: T.text, fontSize: 13, fontWeight: 700 }}>
                        <input type="checkbox" checked={pending.dataService} onChange={(e) => setPending({ ...pending, dataService: e.target.checked })} />
                        Habilitar servicio de datos
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, color: T.text, fontSize: 13, fontWeight: 700 }}>
                        <input type="checkbox" checked={pending.smsService} onChange={(e) => setPending({ ...pending, smsService: e.target.checked })} />
                        Habilitar servicio SMS
                      </label>
                      {!servicesValid && <p style={{ margin: 0, color: T.danger, fontSize: 12 }}>Moabits requiere datos o SMS activo para este cambio.</p>}
                    </div>
                  )}
                </>
              ) : (
                <label style={{ display: "grid", gap: 7, color: T.text, fontSize: 13, fontWeight: 700 }}>
                  Escribe el ICCID para confirmar
                  <input
                    value={pending.confirmText ?? ""}
                    onChange={(e) => setPending({ ...pending, confirmText: e.target.value })}
                    style={{ border: `1px solid ${T.border}`, borderRadius: 5, padding: "9px 10px", fontFamily: T.fontMono, color: T.text }}
                    autoFocus
                  />
                </label>
              )}
            </div>
            <div style={{ padding: 14, borderTop: `1px solid ${T.divider}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => setPending(null)} disabled={busy} style={{ border: `1px solid ${T.border}`, background: T.cardBg, color: T.text, borderRadius: 5, padding: "9px 11px", cursor: busy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 800 }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitAction}
                disabled={busy || !servicesValid || !purgeConfirmValid}
                aria-busy={busy || undefined}
                style={{ border: "1px solid transparent", background: busy || !servicesValid || !purgeConfirmValid ? "#C7CDD4" : T.title, color: "#FFFFFF", borderRadius: 5, padding: "9px 11px", cursor: busy || !servicesValid || !purgeConfirmValid ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 7 }}
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                {busy ? "Cargando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LimitGroup({ title, controls }: { title: string; controls: Record<string, UsageControl> | null }) {
  const entries = Object.entries(controls ?? {});
  return (
    <Card title={title}>
      {entries.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {entries.map(([metric, c]) => (
            <KV
              key={metric}
              label={prettyKey(metric)}
              value={`${formatVal(c.value)} / ${formatVal(c.limit)}`}
              sub={[c.threshold_reached ? "umbral alcanzado" : null, c.traffic_cut ? "tráfico cortado" : null, c.enabled === false ? "deshabilitado" : null].filter(Boolean).join(" · ") || "normal"}
              dot={c.traffic_cut ? T.danger : c.threshold_reached ? T.warning : T.success}
            />
          ))}
        </div>
      ) : (
        <Empty text="Sin controles configurados." />
      )}
    </Card>
  );
}

function useUsage(iccid: string, qs?: string): AsyncState<UsageOut> {
  const key = `${iccid}:${qs ?? ""}`;
  const [state, setState] = useState<{ key: string; value: AsyncState<UsageOut> }>({
    key,
    value: { status: "loading" },
  });
  useEffect(() => {
    let alive = true;
    getUsage(iccid, qs).then(
      (data) => alive && setState({ key, value: { status: "success", data } }),
      (err) => {
        const e = errorMessage(err);
        if (alive) setState({ key, value: { status: "error", ...e } });
      }
    );
    return () => {
      alive = false;
    };
  }, [iccid, key, qs]);
  return state.key === key ? state.value : { status: "loading" };
}

function usePresence(iccid: string): AsyncState<PresenceOut> {
  const [state, setState] = useState<{ key: string; value: AsyncState<PresenceOut> }>({
    key: iccid,
    value: { status: "loading" },
  });
  useEffect(() => {
    let alive = true;
    getPresence(iccid).then(
      (data) => alive && setState({ key: iccid, value: { status: "success", data } }),
      (err) => {
        const e = errorMessage(err);
        if (alive) setState({ key: iccid, value: { status: "error", ...e } });
      }
    );
    return () => {
      alive = false;
    };
  }, [iccid]);
  return state.key === iccid ? state.value : { status: "loading" };
}

function useSimLocation(iccid: string): AsyncState<LocationOut> {
  const [state, setState] = useState<{ key: string; value: AsyncState<LocationOut> }>({
    key: iccid,
    value: { status: "loading" },
  });
  useEffect(() => {
    let alive = true;
    getLocation(iccid).then(
      (data) => alive && setState({ key: iccid, value: { status: "success", data } }),
      (err) => {
        const e = errorMessage(err);
        if (alive) setState({ key: iccid, value: { status: "error", ...e } });
      }
    );
    return () => {
      alive = false;
    };
  }, [iccid]);
  return state.key === iccid ? state.value : { status: "loading" };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, color: T.title, fontWeight: 800, fontSize: 13 }}>
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function KV({ label, value, sub, mono, dot }: { label: string; value: string; sub?: string; mono?: boolean; dot?: string }) {
  return (
    <div style={{ padding: 16, borderRight: `1px solid ${T.divider}`, borderBottom: `1px solid ${T.divider}`, minWidth: 0 }}>
      <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.6, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: T.title, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: mono ? T.fontMono : T.fontBody, display: "flex", alignItems: "center", gap: 7 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: 99, background: dot, flexShrink: 0 }} />}
        {value}
      </div>
      {sub && <div style={{ color: T.muted, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: 18, color: T.muted, fontSize: 13 }}>{text}</div>;
}

function BarChart({ bars }: { bars: { label: string; value: number; unit: string }[] }) {
  const visibleBars = useMemo(() => bars.slice(-30), [bars]);
  const max = Math.max(...visibleBars.map((b) => b.value), 1);
  return (
    <div style={{ padding: 18 }}>
      <div style={{ height: 180, display: "flex", alignItems: "end", gap: 6 }}>
        {visibleBars.map((b, i) => (
          <div key={`${b.label}-${i}`} style={{ flex: 1, minWidth: 8, display: "flex", alignItems: "end" }}>
            <div title={`${b.label}: ${b.value} ${b.unit}`} style={{ width: "100%", height: `${Math.max(6, (b.value / max) * 170)}px`, background: T.headerAccent, borderRadius: "3px 3px 0 0" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function presenceColor(state: PresenceOut["state"]) {
  if (state === "online") return T.success;
  if (state === "offline") return T.danger;
  return T.muted;
}
