"use client";

import { newIdempotencyKey } from "@/lib/api/idempotency";
import { getPresence, getUsage, purgeSim, setSimStatus } from "@/lib/api/sims";
import { toast, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui";
import type { CapabilityOut, PresenceOut, ProviderCapabilitiesOut, SubscriptionOut, UsageControl, UsageOut } from "@/lib/types/api";
import type { AdministrativeStatus } from "@/lib/types/api/common";
import { ROLES, type UserRole } from "@/lib/types/user";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fmtDate, formatVal, looksMono, prettyKey } from "./data";
import { SourceBadge, StatusPillWithNative } from "./primitives";
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

function usageWindowQuery(days = 30) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const qs = new URLSearchParams({
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    metrics: "data",
  });
  return qs.toString();
}

function mergedAttributes(subscription: SubscriptionOut) {
  return Object.entries({
    ...subscription.provider_fields,
    ...subscription.normalized.custom_fields,
  }).filter(([, v]) => v !== undefined);
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
  const [tab, setTab] = useState<TabId>(initialTab);
  const src = SOURCES[subscription.provider];
  const n = subscription.normalized;
  const statusLabel = STATUS_META[subscription.status]?.label ?? subscription.status;
  const services = n.services.active?.length
    ? n.services.active.join(" / ")
    : [n.services.data_service ? "data" : null, n.services.sms_service ? "sms" : null].filter(Boolean).join(" / ");

  return (
    <main style={{ background: T.pageBg, color: T.text, fontFamily: T.fontBody, minHeight: "calc(100vh - 64px)", padding: 24 }}>
      <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ height: 4, background: src.color }} />
        <div style={{ padding: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <SourceBadge source={subscription.provider} withName />
              <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.muted }}>{subscription.iccid}</span>
            </div>
            <h1 style={{ margin: 0, color: T.title, fontSize: 24, letterSpacing: -0.3 }}>{value(n.customer.name)}</h1>
            <p style={{ margin: "6px 0 0", color: T.muted, fontFamily: T.fontMono, fontSize: 12 }}>
              {value(subscription.msisdn)} · {value(subscription.imsi)}
            </p>
          </div>
          <StatusPillWithNative status={subscription.status} nativeStatus={subscription.native_status} sourceName={src.name} size="md" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", borderTop: `1px solid ${T.divider}` }}>
          <KV label={n.limits.data == null ? "Último cambio" : "Datos permitidos"} value={n.limits.data == null ? fmtDate(n.status.last_changed_at) : mbToLabel(n.limits.data)} sub={n.limits.data == null ? relativeTime(subscription.updated_at) : `Servicios: ${services || "—"}`} />
          <KV label="Plan" value={value(n.plan.name)} sub={value(n.plan.code)} />
          <KV label="Comm. Plan" value={value(n.plan.communication_plan)} />
          <KV label="Activado" value={fmtDate(subscription.activated_at)} />
          <KV label="Expira plan" value={fmtDate(n.plan.expires_at)} />
          <HeroUsage iccid={subscription.iccid} />
        </div>
      </section>

      <nav style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              border: `1px solid ${tab === item.id ? src.color : T.border}`,
              background: tab === item.id ? src.tintBg : T.cardBg,
              color: tab === item.id ? src.tintText : T.text,
              borderRadius: 5,
              padding: "8px 11px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

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
    </main>
  );
}

function HeroUsage({ iccid }: { iccid: string }) {
  const state = useUsage(iccid, usageWindowQuery(30));
  if (state.status === "error") return <KV label="Consumo 30 días" value="Datos no disponibles" sub={state.message} />;
  if (state.status !== "success") return <KV label="Consumo 30 días" value="Cargando..." sub="Consultando proveedor" />;
  const bars = usageBars(state.data);
  return <MiniChart label="Consumo 30 días" bars={bars} />;
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
    ["ID compañía", subscription.company_id, true],
  ] as const;
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
  | { kind: "status"; target: AdministrativeStatus; dataService: boolean; smsService: boolean }
  | { kind: "purge"; confirmText: string };

function canClickCapability(capability: CapabilityOut | undefined) {
  return capability?.status === "supported" || capability?.status === "requires_confirmation";
}

function capabilityDisabledReason(capability: CapabilityOut | undefined) {
  if (!capability) return "El proveedor no reportó esta capacidad.";
  if (capability.status === "supported" || capability.status === "requires_confirmation") return null;
  return capability.reason || "Esta operación no está habilitada para el proveedor.";
}

function actionErrorMessage(err: unknown) {
  const parsed = errorMessage(err);
  return parsed.message || "No pudimos ejecutar la acción.";
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
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const statusCapability = capabilities.capabilities.set_administrative_status;
  const purgeCapability = capabilities.capabilities.purge;
  const isAdmin = currentUserRole === ROLES.ADMIN;
  const disabledReason = capabilityDisabledReason(statusCapability);
  const canSetStatus = isAdmin && canClickCapability(statusCapability);
  const targets = statusCapability?.targets ?? [];
  const isMoabitsServiceTarget =
    subscription.provider === "moabits" &&
    pending?.kind === "status" &&
    (pending.target === "active" || pending.target === "suspended");
  const servicesValid = !isMoabitsServiceTarget || pending.dataService || pending.smsService;
  const purgeConfirmValid = pending?.kind !== "purge" || pending.confirmText === subscription.iccid;

  if (!isAdmin) {
    return (
      <Card title="Acciones">
        <div style={{ padding: 16 }}>
          <div
            role="note"
            style={{
              border: `1px solid ${T.warning}`,
              background: "#FBEFD4",
              color: "#7A4E0B",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Solo un administrador puede ejecutar cambios de estado o purgas.
          </div>
        </div>
      </Card>
    );
  }

  async function submitAction() {
    if (!pending || busy || !servicesValid || !purgeConfirmValid) return;
    setBusy(true);
    const idempotencyKey = newIdempotencyKey();
    try {
      if (pending.kind === "status") {
        await setSimStatus(
          subscription.iccid,
          {
            target: pending.target,
            data_service: isMoabitsServiceTarget ? pending.dataService : undefined,
            sms_service: isMoabitsServiceTarget ? pending.smsService : undefined,
          },
          idempotencyKey
        );
        toast.success(`Estado enviado: ${STATUS_META[pending.target]?.label ?? pending.target}.`);
      } else {
        await purgeSim(subscription.iccid, idempotencyKey);
        toast.success("Purga enviada al proveedor.");
      }
      setPending(null);
      router.refresh();
    } catch (err) {
      toast.error(actionErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Acciones">
      <div style={{ padding: 16, display: "grid", gap: 16 }}>
        <section style={{ display: "grid", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, color: T.title, fontSize: 14 }}>Cambiar estado administrativo</h3>
            <p style={{ margin: "4px 0 0", color: T.muted, fontSize: 12 }}>
              {disabledReason ?? `Capacidad reportada por ${SOURCES[subscription.provider].name}.`}
            </p>
          </div>

          {targets.length ? (
            <TooltipProvider>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {targets.map((target) => {
                  const meta = STATUS_META[target];
                  const disabled = !canSetStatus || target === subscription.status;
                  const title = target === subscription.status
                      ? "La SIM ya está en este estado."
                      : disabledReason ?? undefined;
                  const button = (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setPending({
                        kind: "status",
                        target,
                        dataService: subscription.normalized.services.data_service ?? true,
                        smsService: subscription.normalized.services.sms_service ?? true,
                      })}
                      style={{
                        border: `1px solid ${disabled ? T.border : meta?.color ?? T.border}`,
                        background: disabled ? "#F3F4F6" : meta?.bg ?? T.cardBg,
                        color: disabled ? T.muted : meta?.color ?? T.text,
                        borderRadius: 5,
                        padding: "9px 11px",
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                        opacity: disabled ? 0.65 : 1,
                      }}
                    >
                      {meta?.label ?? target}
                    </button>
                  );

                  return title ? (
                    <Tooltip key={target}>
                      <TooltipTrigger asChild>
                        <span>{button}</span>
                      </TooltipTrigger>
                      <TooltipContent>{title}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <span key={target}>{button}</span>
                  );
                })}
              </div>
            </TooltipProvider>
          ) : (
            <Empty text="Este proveedor no publicó estados destino para esta SIM." />
          )}
        </section>

        {isAdmin && purgeCapability?.status === "supported" && (
          <section style={{ borderTop: `1px solid ${T.divider}`, paddingTop: 14, display: "grid", gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, color: T.title, fontSize: 14 }}>Purga</h3>
              <p style={{ margin: "4px 0 0", color: T.muted, fontSize: 12 }}>
                Acción irreversible protegida con confirmación por ICCID.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setPending({ kind: "purge", confirmText: "" })}
                style={{
                  border: `1px solid ${T.danger}`,
                  background: "#FADDD6",
                  color: "#A84234",
                  borderRadius: 5,
                  padding: "9px 11px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Purgar SIM
              </button>
            </div>
          </section>
        )}
      </div>

      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(15, 23, 42, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
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
                        <input
                          type="checkbox"
                          checked={pending.dataService}
                          onChange={(event) => setPending({ ...pending, dataService: event.target.checked })}
                        />
                        Habilitar servicio de datos
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, color: T.text, fontSize: 13, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={pending.smsService}
                          onChange={(event) => setPending({ ...pending, smsService: event.target.checked })}
                        />
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
                    value={pending.confirmText}
                    onChange={(event) => setPending({ ...pending, confirmText: event.target.value })}
                    style={{ border: `1px solid ${T.border}`, borderRadius: 5, padding: "9px 10px", fontFamily: T.fontMono, color: T.text }}
                    autoFocus
                  />
                </label>
              )}
            </div>
            <div style={{ padding: 14, borderTop: `1px solid ${T.divider}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy}
                style={{ border: `1px solid ${T.border}`, background: T.cardBg, color: T.text, borderRadius: 5, padding: "9px 11px", cursor: busy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 800 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitAction}
                disabled={busy || !servicesValid || !purgeConfirmValid}
                style={{ border: "1px solid transparent", background: busy || !servicesValid || !purgeConfirmValid ? "#C7CDD4" : T.title, color: "#FFFFFF", borderRadius: 5, padding: "9px 11px", cursor: busy || !servicesValid || !purgeConfirmValid ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 800 }}
              >
                {busy ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
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

function MiniChart({ label, bars }: { label: string; bars: { label: string; value: number; unit: string }[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div style={{ padding: 16, borderRight: `1px solid ${T.divider}`, borderBottom: `1px solid ${T.divider}` }}>
      <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.6, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ height: 40, display: "flex", alignItems: "end", gap: 3 }}>
        {bars.slice(-18).map((b, i) => (
          <span key={`${b.label}-${i}`} title={`${b.label}: ${b.value} ${b.unit}`} style={{ flex: 1, minWidth: 3, height: `${Math.max(8, (b.value / max) * 40)}px`, background: T.info, borderRadius: 2, opacity: 0.35 + (b.value / max) * 0.55 }} />
        ))}
      </div>
    </div>
  );
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
