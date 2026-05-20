"use client";

import { newIdempotencyKey } from "@/lib/api/idempotency";
import { getPresence, getUsage, setSimStatus } from "@/lib/api/sims";
import { toast } from "@/components/ui";
import type { PresenceOut, ProviderCapabilitiesOut, SubscriptionOut, UsageControl, UsageOut } from "@/lib/types/api";
import type { AdministrativeStatus } from "@/lib/types/api/common";
import { ROLES, type UserRole } from "@/lib/types/user";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fmtDate, formatVal, looksMono, prettyKey } from "./data";
import { Btn, Icon, SourceBadge, StatusPillWithNative } from "./primitives";
import { SOURCES, STATUS_META, T } from "./tokens";

type TabId = "detail" | "history" | "usage" | "presence" | "limits" | "actions";
type AsyncState<T> =
  | { status: "idle" | "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string; code?: string };

const TABS: { id: TabId; label: string }[] = [
  { id: "detail", label: "Detalle" },
  { id: "history", label: "Estado e historial" },
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

function relativeTime(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s).getTime();
  if (Number.isNaN(d)) return "—";
  const diffDays = Math.max(0, Math.round((Date.now() - d) / 86_400_000));
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "hace 1 día";
  if (diffDays < 31) return `hace ${diffDays} días`;
  const months = Math.round(diffDays / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
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
  const src = SOURCES[subscription.provider];
  const n = subscription.normalized;
  const statusLabel = STATUS_META[subscription.status]?.label ?? subscription.status;

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
        <span style={{ fontFamily: T.fontMono, color: T.title, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subscription.iccid}
        </span>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" size="sm" icon={<Icon.copy size={12} />} onClick={copyIccid}>
          {copiedIccid ? "Copiado" : "Copiar ICCID"}
        </Btn>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted, padding: "3px 8px", background: T.zebra, borderRadius: 4, border: `1px solid ${T.border}` }}>
          /subscriptions/{subscription.iccid.toLowerCase()}
        </span>
      </div>

      {/* Hero section */}
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "20px 24px 0" }}>
        {/* Avatar + info + actions */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <HeroMeta label="Fuente">
                <SourceBadge source={subscription.provider} size="sm" withName />
              </HeroMeta>
              <HeroMeta label="Estado">
                <StatusPillWithNative status={subscription.status} nativeStatus={subscription.native_status} sourceName={src.name} size="sm" />
              </HeroMeta>
            </div>
            <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.7, fontWeight: 800, textTransform: "uppercase", marginBottom: 3 }}>ICCID</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: 0, fontFamily: T.fontMono, overflowWrap: "anywhere" }}>{subscription.iccid}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
              {n.customer.name && <HeroMeta label="Cliente">{n.customer.name}</HeroMeta>}
              {subscription.msisdn && <HeroMeta label="MSISDN" mono>{subscription.msisdn}</HeroMeta>}
              {subscription.imsi && <HeroMeta label="IMSI" mono>{subscription.imsi}</HeroMeta>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Btn variant="outline" size="md" icon={<Icon.refresh size={13} />} onClick={() => router.refresh()}>
              Sincronizar
            </Btn>
            <Btn variant="primary" size="md" color={src.color} onClick={() => setTab("actions")}>
              Acciones
            </Btn>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: T.border, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
          <Kpi label="Plan" text={value(n.plan.name)} sub={value(n.plan.code)} />
          <Kpi label="Datos permitidos" text={mbToLabel(n.limits.data)} sub="por SIM" />
          <Kpi label="Expira plan" text={fmtDate(n.plan.expires_at)} sub={relativeTime(n.plan.expires_at)} />
          <Kpi label="Antigüedad" text={antiquityFor(subscription.activated_at)} sub={subscription.activated_at ? `Desde ${fmtDate(subscription.activated_at)}` : undefined} />
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
        {tab === "detail" && <DetailTab subscription={subscription} statusLabel={statusLabel} />}
        {tab === "history" && <HistoryTab subscription={subscription} statusLabel={statusLabel} />}
        {tab === "usage" && <UsageTab subscription={subscription} />}
        {tab === "presence" && <PresenceTab iccid={subscription.iccid} />}
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

function antiquityFor(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  const now = new Date();
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 1) return "Nueva";
  if (months < 12) return `${months} mes${months > 1 ? "es" : ""}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}a ${m}m` : `${y} año${y > 1 ? "s" : ""}`;
}

function Kpi({ label, text, sub }: { label: string; text: string; sub?: string }) {
  return (
    <div style={{ background: T.cardBg, padding: "12px 16px" }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.title, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function HeroMeta({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div
      style={{
        minHeight: 34,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
        padding: "5px 9px",
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        background: T.zebra,
      }}
    >
      <span style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.7, fontWeight: 800, textTransform: "uppercase", lineHeight: 1, flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          color: T.title,
          fontSize: 12.5,
          fontWeight: 700,
          fontFamily: mono ? T.fontMono : T.fontBody,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function DetailTab({ subscription, statusLabel }: { subscription: SubscriptionOut; statusLabel: string }) {
  const rows = [
    ["ICCID", subscription.iccid, true],
    ["MSISDN", subscription.msisdn, true],
    ["IMSI", subscription.imsi, true],
    ["Operador", SOURCES[subscription.provider].name, false],
    ["Estado", statusLabel, false],
    ["Estado nativo", subscription.native_status, true],
    ["Activado", fmtDate(subscription.activated_at), false],
    ["Última actualización", fmtDate(subscription.updated_at), false],
  ] as [string, string | null | undefined, boolean][];
  const attrs = mergedAttributes(subscription);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Información general">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
          {rows.map(([label, val, mono]) => <KV key={label} label={label} value={value(val)} mono={mono} />)}
        </div>
      </Card>
      <Card title={`Atributos específicos · ${SOURCES[subscription.provider].name}`}>
        {attrs.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {attrs.map(([k, v]) => <KV key={k} label={prettyKey(k)} value={formatVal(v)} mono={looksMono(k)} />)}
          </div>
        ) : (
          <Empty text="Este proveedor no envió atributos adicionales para esta SIM." />
        )}
      </Card>
    </div>
  );
}

function HistoryTab({ subscription, statusLabel }: { subscription: SubscriptionOut; statusLabel: string }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Histórico de estado">
        <Empty text={subscription.provider === "kite" ? "El histórico nativo aún no está disponible vía Bismark API." : `El proveedor ${SOURCES[subscription.provider].name} no expone histórico de estados en Bismark API.`} />
      </Card>
      <Card title="Mapeo de estados">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <KV label="Estado normalizado" value={statusLabel} />
          <KV label="Código canónico" value={subscription.status} mono />
          <KV label={`Estado ${SOURCES[subscription.provider].name}`} value={value(subscription.native_status)} mono />
        </div>
      </Card>
    </div>
  );
}

function UsageTab({ subscription }: { subscription: SubscriptionOut }) {
  const state = useUsage(subscription.iccid, "metrics=data");
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

function PresenceTab({ iccid }: { iccid: string }) {
  const state = usePresence(iccid);
  if (state.status === "error") {
    const unsupported = state.code === "provider.unsupported_operation";
    return <Card title="Presencia y red"><Empty text={unsupported ? "Este proveedor no expone presencia para la SIM." : state.message} /></Card>;
  }
  if (state.status !== "success") return <Card title="Presencia y red"><Empty text="Consultando presencia..." /></Card>;
  const p = state.data;
  return (
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
  | { kind: "status"; target: AdministrativeStatus; dataService: boolean; smsService: boolean; idempotencyKey: string }
  | { kind: "purge"; confirmText: string; idempotencyKey: string };

function actionErrorMessage(err: unknown) {
  const parsed = errorMessage(err);
  return parsed.message || "No pudimos ejecutar la acción.";
}

function purgeBodyFor(provider: SubscriptionOut["provider"]) {
  if (provider === "kite") {
    return "Ejecuta networkReset en Kite. Reinicia la sesión y la IP, pero no cambia el estado administrativo.";
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
  const src = SOURCES[subscription.provider];
  const isAdmin = currentUserRole === ROLES.ADMIN;
  const statusCapability = capabilities.capabilities.set_administrative_status;
  const targets = statusCapability?.targets ?? [];
  const purgeCapability = capabilities.capabilities.purge;
  const canPurge = purgeCapability?.status === "supported";

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  const isMoabitsServiceTarget =
    subscription.provider === "moabits" &&
    pending?.kind === "status" &&
    (pending.target === "active" || pending.target === "suspended");
  const servicesValid = !isMoabitsServiceTarget || (pending?.kind === "status" && (pending.dataService || pending.smsService));
  const purgeConfirmValid = pending?.kind !== "purge" || pending.confirmText === subscription.iccid;

  // Build action rows from capabilities
  type ActionKey = "reactivate" | "sync" | "purge";
  interface ActionDef { key: ActionKey; title: string; body: string; color: string; danger: boolean; icon: React.ReactNode }

  const canReactivate = targets.includes("active") && subscription.status !== "active";

  const actionDefs: ActionDef[] = [
    ...(canReactivate ? [{
      key: "reactivate" as ActionKey,
      title: "Reactivar suscripción",
      body: `Restablece la línea al estado Activa. Mapeado al endpoint de activación en ${src.name}.`,
      color: T.success,
      danger: false,
      icon: <Icon.play size={12} />,
    }] : []),
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
    } else if (key === "reactivate") {
      setPending({
        kind: "status",
        target: "active",
        dataService: subscription.normalized.services.data_service ?? true,
        smsService: subscription.normalized.services.sms_service ?? true,
        idempotencyKey: newIdempotencyKey(),
      });
    } else {
      router.refresh();
    }
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
        toast.success(`Estado enviado: ${STATUS_META[pending.target]?.label ?? pending.target}.`);
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
          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
            estado: {STATUS_META[subscription.status]?.label ?? subscription.status}
          </span>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {actionDefs.length === 0 && <Empty text="Sin acciones disponibles para el estado actual." />}
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
                style={{
                  border: `1px solid ${a.danger ? T.danger + "66" : T.border}`,
                  background: "#fff",
                  color: a.danger ? T.danger : T.text,
                  borderRadius: 5,
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                  fontFamily: T.fontBody,
                }}
              >
                {a.danger ? "Confirmar…" : "Ejecutar"}
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
                    Enviar cambio a <strong>{STATUS_META[pending.target]?.label ?? pending.target}</strong>.
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
