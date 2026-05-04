"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import {
  antiquityFor,
  fmtCOP,
  fmtDate,
  fmtShortDate,
  formatVal,
  looksMono,
  NOW_REFERENCE,
  prettyKey,
  SubscriptionRecord,
} from "./data";
import {
  Btn,
  Icon,
  SourceBadge,
  StatusPill,
  StatusPillWithNative,
  UsageBar,
} from "./primitives";
import { SOURCES, SourceMeta, STATUS_META, T } from "./tokens";

interface TabProps {
  r: SubscriptionRecord;
  src: SourceMeta;
}

function Card({
  title,
  children,
  accent,
  right,
}: {
  title: string;
  children: ReactNode;
  accent?: string;
  right?: ReactNode;
}) {
  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          borderBottom: `1px solid ${T.divider}`,
        }}
      >
        {accent && <span style={{ width: 3, height: 14, background: accent, borderRadius: 2 }} />}
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.8,
            color: T.muted,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div style={{ flex: 1 }} />
        {right}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function KV({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 10.5, letterSpacing: 0.4, color: T.muted, fontWeight: 600, marginBottom: 3 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: color || T.title,
          fontWeight: 500,
          fontFamily: mono ? T.fontMono : T.fontBody,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: 0.6,
          color: T.muted,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: T.title,
          fontFamily: mono ? T.fontMono : T.fontBody,
          letterSpacing: -0.3,
          lineHeight: 1.15,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Kpi({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div style={{ background: T.cardBg, padding: "12px 16px" }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1,
          color: T.muted,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: T.title,
          fontFamily: mono ? T.fontMono : T.fontBody,
          letterSpacing: -0.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function FocalHero({ r, src }: TabProps) {
  const u = r.usage;
  const hasCap = u && u.used != null && u.total != null;
  const pct = hasCap ? Math.min(100, (u.used / (u.total as number)) * 100) : null;
  const pctColor = pct == null ? src.color : pct >= 90 ? T.danger : pct >= 70 ? T.warning : src.color;

  const renewalDays = useMemo(() => {
    if (!r.nextRenewal || r.nextRenewal === "—") return null;
    const d = new Date(r.nextRenewal);
    const now = new Date(NOW_REFERENCE);
    if (Number.isNaN(d.getTime())) return null;
    return Math.round((d.getTime() - now.getTime()) / 86_400_000);
  }, [r.nextRenewal]);

  // Deterministic 30-day shape seeded from the record id.
  const trend = useMemo(() => {
    let h = 0;
    for (const c of r.id) h = (h * 31 + c.charCodeAt(0)) | 0;
    const rnd = () => {
      h = (h * 9301 + 49297) % 233_280;
      return h / 233_280;
    };
    const base = hasCap ? u.used / (u.total as number) : 0.55;
    const arr: number[] = [];
    for (let i = 0; i < 30; i++) {
      const noise = (rnd() - 0.5) * 0.18;
      const drift = (i / 30) * (base > 0.4 ? 0.22 : 0.05);
      arr.push(Math.max(0.02, Math.min(1, base * 0.55 + drift + noise)));
    }
    return arr;
  }, [r.id, hasCap, u]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 280px",
        gap: 0,
        marginBottom: 16,
        background: T.cardBg,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: src.color }} />

      {/* Panel 1 — primary signal */}
      <div style={{ padding: "20px 22px 22px 26px", borderRight: `1px solid ${T.divider}` }}>
        {hasCap && pct != null ? (
          <>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: 1,
                color: T.muted,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Consumo del ciclo
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 700,
                  color: pctColor,
                  fontFamily: T.fontMono,
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                {pct.toFixed(0)}
              </span>
              <span style={{ fontSize: 18, color: pctColor, fontWeight: 600, fontFamily: T.fontMono }}>%</span>
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontFamily: T.fontMono }}>
              {u.used.toLocaleString("es-CO")} / {u.total} {u.unit}
            </div>
            <div
              style={{
                marginTop: 14,
                height: 8,
                background: "#E6ECEC",
                borderRadius: 4,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: pctColor,
                  borderRadius: 4,
                  transition: "width .4s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "70%",
                  top: -2,
                  width: 1,
                  height: 12,
                  background: T.warning,
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "90%",
                  top: -2,
                  width: 1,
                  height: 12,
                  background: T.danger,
                  opacity: 0.6,
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: 1,
                color: T.muted,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Próxima renovación
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 700,
                  color: renewalDays != null && renewalDays < 0 ? T.danger : T.title,
                  fontFamily: T.fontMono,
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                {renewalDays != null ? Math.abs(renewalDays) : "—"}
              </span>
              <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
                {renewalDays == null ? "" : renewalDays < 0 ? "días en mora" : "días"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontFamily: T.fontMono }}>
              {fmtDate(r.nextRenewal)}
            </div>
          </>
        )}
      </div>

      {/* Panel 2 — financial + lifecycle */}
      <div
        style={{
          padding: "20px 22px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px 24px",
          borderRight: `1px solid ${T.divider}`,
        }}
      >
        <HeroStat label="Monto por ciclo" value={fmtCOP(r.amount)} sub={r.cycle.toLowerCase()} mono />
        <HeroStat label="Plan" value={r.plan} sub={`Desde ${fmtShortDate(r.createdAt)}`} />
        <HeroStat label="Antigüedad" value={antiquityFor(r.createdAt)} sub="con Bismark" />
        <HeroStat
          label="Última factura"
          value={String(r.specific?.last_invoice_status ?? "Pagada")}
          sub={fmtShortDate("2026-04-15")}
        />
      </div>

      {/* Panel 3 — sparkline */}
      <div style={{ padding: "20px 22px 18px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: 1,
              color: T.muted,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Actividad · 30d
          </span>
          <span style={{ fontSize: 11, color: src.color, fontFamily: T.fontMono, fontWeight: 700 }}>
            {hasCap && pct != null && pct >= 70 ? "↑ alta" : "→ estable"}
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, minHeight: 60, paddingTop: 6 }}>
          {trend.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(8, v * 100)}%`,
                background: i >= 26 ? src.color : src.color + "88",
                borderRadius: "1.5px 1.5px 0 0",
                minHeight: 3,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: T.muted,
            fontFamily: T.fontMono,
            marginTop: 6,
            letterSpacing: 0.4,
          }}
        >
          <span>−30d</span>
          <span>hoy</span>
        </div>
      </div>
    </div>
  );
}

function TabDetalle({ r, src }: TabProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
      <div>
        <Card title="Información general">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 18px" }}>
            <KV label="ID unificado" value={r.id} mono />
            <KV label="Plan" value={r.plan} />
            <KV label="Ciclo" value={r.cycle} />
            <KV label="Monto" value={fmtCOP(r.amount)} mono />
            <KV label="Próxima renovación" value={fmtDate(r.nextRenewal)} />
            <KV label="Creado" value={fmtDate(r.createdAt)} />
            <KV label="Compañía padre" value={r.parent} />
            <KV label="Cliente" value={r.customer} />
            <KV label="Email" value={r.customerEmail} mono />
          </div>
        </Card>
        <Card title={`Atributos específicos · ${src.name}`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 18px" }}>
            {Object.entries(r.specific).map(([k, v]) => (
              <KV key={k} label={prettyKey(k)} value={formatVal(v)} mono={looksMono(k)} />
            ))}
          </div>
        </Card>
      </div>
      <div>
        <Card
          title="Resumen de consumo"
          right={
            <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
              {r.usage?.label || "Mes en curso"}
            </span>
          }
        >
          <UsageBar used={r.usage?.used} total={r.usage?.total} unit={r.usage?.unit} width={"100%"} />
          <div style={{ marginTop: 14, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
            Las cifras provienen directamente de <strong style={{ color: T.title }}>{src.name}</strong>. La frecuencia
            de actualización depende de la fuente.
          </div>
        </Card>
        <Card title="Estado actual">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <StatusPill status={r.status} size="md" />
            <span style={{ fontSize: 12, color: T.muted, fontFamily: T.fontMono }}>nativo: {r.nativeStatus}</span>
          </div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
            Mapeado al vocabulario unificado de Bismark. El valor original que reporta la fuente se conserva como
            referencia.
          </div>
        </Card>
      </div>
    </div>
  );
}

function TabEstado({ r, src }: TabProps) {
  const events = [
    {
      date: "2026-04-15 10:22",
      from: r.nativeStatus,
      to: r.nativeStatus,
      actor: "sistema",
      kind: "sync" as const,
      note: "Sincronización rutinaria desde " + src.name,
    },
    {
      date: "2026-03-22 14:08",
      from: "TEST",
      to: r.nativeStatus,
      actor: "sofia.arias",
      kind: "change" as const,
      note: "Activación manual tras pago confirmado",
    },
    {
      date: "2026-03-21 09:31",
      from: "PURGED",
      to: "TEST",
      actor: "d.quintero",
      kind: "change" as const,
      note: "Restauración a periodo de prueba",
    },
    {
      date: "2026-02-08 16:44",
      from: "ACTIVE",
      to: "PURGED",
      actor: "sistema",
      kind: "change" as const,
      note: "Auto-purga por 90 días sin tráfico",
    },
    {
      date: "2024-03-14 11:00",
      from: "—",
      to: "ACTIVE",
      actor: "onboarding",
      kind: "create" as const,
      note: "Creación inicial de la suscripción",
    },
  ];
  const kindColor: Record<typeof events[number]["kind"], string> = {
    sync: T.muted,
    change: T.warning,
    create: T.success,
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
      <Card
        title="Histórico de estados"
        right={
          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
            {events.length} eventos · últ. 24 meses
          </span>
        }
      >
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 1, background: T.divider }} />
          {events.map((e, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 130px 1fr 110px",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 0",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: T.cardBg,
                  border: `2px solid ${kindColor[e.kind]}`,
                  marginTop: 2,
                  zIndex: 1,
                }}
              />
              <div style={{ fontFamily: T.fontMono, fontSize: 11.5, color: T.muted }}>{e.date}</div>
              <div>
                <div style={{ fontSize: 12.5, color: T.title, fontWeight: 500 }}>{e.note}</div>
                {e.from !== e.to && (
                  <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted, marginTop: 3 }}>
                    <span style={{ background: T.zebra, padding: "1px 6px", borderRadius: 3 }}>{e.from}</span>
                    {" → "}
                    <span
                      style={{
                        background: T.zebra,
                        color: T.title,
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontWeight: 600,
                      }}
                    >
                      {e.to}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono, textAlign: "right" }}>{e.actor}</div>
            </div>
          ))}
        </div>
        {r.source !== "kite" && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#FBEFD414",
              border: `1px solid ${T.warning}66`,
              borderRadius: 4,
              fontSize: 11.5,
              color: T.warning,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon.warn size={13} />
            {src.name} no expone histórico nativo. Bismark reconstruye los eventos a partir de sincronizaciones.
          </div>
        )}
      </Card>
      <div>
        <Card title="Mapeo de estados">
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Cada fuente reporta sus propios valores. Bismark los normaliza al vocabulario unificado.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: "8px 10px",
              fontSize: 12,
              alignItems: "center",
            }}
          >
            <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.title, fontWeight: 600 }}>
              {r.nativeStatus}
            </div>
            <span style={{ color: T.muted }}>→</span>
            <div>
              <StatusPill status={r.status} size="sm" />
            </div>
          </div>
        </Card>
        <Card title="Equivalencias entre fuentes">
          <div style={{ fontSize: 11.5, fontFamily: T.fontMono, color: T.text, lineHeight: 1.7 }}>
            <div>
              <span style={{ color: SOURCES.kite.color, fontWeight: 700 }}>Kite</span>: ACTIVE · TEST · DEACTIVATED
            </div>
            <div>
              <span style={{ color: SOURCES.tele2.color, fontWeight: 700 }}>Tele2</span>: ACTIVATED · PURGED
            </div>
            <div>
              <span style={{ color: SOURCES.moabits.color, fontWeight: 700 }}>Moabits</span>: Active · Ready · Suspended
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TabConsumo({ r }: TabProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const days = 30;
  const series = Array.from({ length: days }, (_, i) => {
    const seed = (i * 7 + 13) % 11;
    return Math.max(0, Math.round(((r.usage?.used ?? 10) / days) * (0.5 + seed / 8) * 10) / 10);
  });
  const cumulative = series.reduce<number[]>((acc, v) => {
    acc.push((acc.at(-1) ?? 0) + v);
    return acc;
  }, []);
  const max = Math.max(...series, 1);
  const total = r.usage?.total;
  const unit = r.usage?.unit ?? "GB";

  return (
    <div>
      <Card
        title="Consumo de datos"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            {(["7d", "30d", "90d"] as const).map((rg) => (
              <button
                key={rg}
                type="button"
                onClick={() => setRange(rg)}
                style={{
                  background: range === rg ? T.headerBg : "transparent",
                  color: range === rg ? "#fff" : T.muted,
                  border: `1px solid ${range === rg ? T.headerBg : T.border}`,
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontSize: 11,
                  fontFamily: T.fontMono,
                  cursor: "pointer",
                }}
              >
                {rg}
              </button>
            ))}
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 18 }}>
          <Kpi
            label="Datos consumidos"
            value={`${(r.usage?.used ?? 0).toLocaleString("es-CO")} ${unit}`}
            mono
            sub="periodo actual"
          />
          <Kpi
            label="Cap del plan"
            value={total ? `${total} ${unit}` : "Sin tope"}
            mono
            sub="límite contractual"
          />
          <Kpi
            label="Promedio diario"
            value={`${(series.reduce((a, b) => a + b, 0) / days).toFixed(1)} ${unit}`}
            mono
            sub="últimos 30 días"
          />
          <Kpi label="Pico diario" value={`${max.toFixed(1)} ${unit}`} mono sub="día más alto" />
        </div>

        <div
          style={{
            marginBottom: 8,
            fontSize: 11,
            color: T.muted,
            fontFamily: T.fontMono,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Consumo diario</span>
          <span>
            Acumulado: {(cumulative.at(-1) ?? 0).toFixed(1)} {unit}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 3,
            height: 120,
            padding: "8px 0",
            borderBottom: `1px solid ${T.divider}`,
          }}
        >
          {series.map((v, i) => {
            const h = (v / max) * 100;
            const dailyCap = total ? total / 30 : null;
            const overCap = dailyCap !== null && v > dailyCap;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    height: `${h}%`,
                    background: overCap ? T.warning : T.headerBg,
                    borderRadius: "2px 2px 0 0",
                    minHeight: 2,
                    opacity: 0.85,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10.5,
            color: T.muted,
            fontFamily: T.fontMono,
            marginTop: 4,
          }}
        >
          <span>hace 30d</span>
          <span>hace 15d</span>
          <span>hoy</span>
        </div>

        {total && r.usage && (
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: T.muted,
                fontFamily: T.fontMono,
                marginBottom: 6,
              }}
            >
              <span>Avance contra cap</span>
              <span>Umbral de alerta: 80%</span>
            </div>
            <UsageBar used={r.usage.used} total={r.usage.total} unit={r.usage.unit} width={"100%"} />
          </div>
        )}
      </Card>

      {r.source === "tele2" && (
        <Card title="Desglose por servicio · Tele2">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Datos</div>
              <UsageBar used={r.usage?.used} total={r.usage?.total} unit="GB" width={"100%"} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>SMS</div>
              <UsageBar used={142} total={500} unit="msgs" width={"100%"} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Voz</div>
              <UsageBar used={88} total={300} unit="min" width={"100%"} />
            </div>
          </div>
        </Card>
      )}
      {r.source === "moabits" && (
        <Card title="Renovaciones de plan · Moabits">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <KV label="Renovaciones plan" value="12 / 24" mono />
            <KV label="Restantes" value="12" mono color={T.success} />
            <KV label="Inicio plan" value={fmtDate("2025-01-15")} />
            <KV label="Expira" value={fmtDate("2027-01-15")} />
          </div>
        </Card>
      )}
    </div>
  );
}

function TabPresencia({ r }: TabProps) {
  if (r.source === "tele2") {
    return (
      <Card title="Presencia y red">
        <div style={{ padding: 24, textAlign: "center", color: T.muted, fontSize: 13 }}>
          Tele2 no expone un endpoint de presencia. Mostramos solo el estado lógico.
        </div>
      </Card>
    );
  }
  const isMoabits = r.source === "moabits";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
      <Card title="Conectividad actual">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 18px" }}>
          <KV label="Estado online" value="Online" color={T.success} />
          <KV label="Última conexión" value="hace 4 min" />
          <KV label="País" value={isMoabits ? "CO · Colombia" : "—"} />
          <KV label="Red / operador" value={isMoabits ? "Tigo CO · 732103" : "KITE-FTTH"} />
          <KV label="RAT" value={isMoabits ? "LTE" : "GPON"} />
          <KV
            label={isMoabits ? "IMSI" : "IP asignada"}
            value={isMoabits ? "732103004458102" : "10.45.22.118"}
            mono
          />
        </div>
      </Card>
      <Card title={isMoabits ? "Última actividad CDR/LU" : "Sesión PDP"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px" }}>
          {isMoabits ? (
            <>
              <KV label="First LU" value={fmtShortDate("2025-01-15")} />
              <KV label="Last LU" value="hace 4 min" />
              <KV label="First CDR" value={fmtShortDate("2025-01-16")} />
              <KV label="Last CDR" value="hace 12 min" />
            </>
          ) : (
            <>
              <KV label="APN" value="internet.kite.co" mono />
              <KV label="SGSN" value="bog-sgsn-02" mono />
              <KV label="GGSN" value="bog-ggsn-01" mono />
              <KV label="Sesión activa" value="2h 14m" />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function TabLimites({ r }: TabProps) {
  const total = r.usage?.total;
  const isMoabits = r.source === "moabits";
  const isTele2 = r.source === "tele2";
  return (
    <div>
      <Card title="Límites configurados">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: T.muted,
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              Datos por SIM
            </div>
            <UsageBar used={r.usage?.used} total={total} unit={r.usage?.unit ?? "GB"} width={"100%"} />
            <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
              Umbral de alerta: <strong>80%</strong> del cap
            </div>
          </div>
          {isTele2 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  marginBottom: 6,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                Overage override
              </div>
              <KV label="Limit override" value="20.00 USD" mono />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                Cuando se supera, la línea pasa a estado limitado.
              </div>
            </div>
          )}
          {isMoabits && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  marginBottom: 6,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                SMS por SIM
              </div>
              <UsageBar used={42} total={500} unit="msgs" width={"100%"} />
            </div>
          )}
        </div>
      </Card>
      {isMoabits && (
        <Card title={`Límites por compañía · ${r.parent}`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  marginBottom: 6,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                Datos compañía
              </div>
              <UsageBar used={1240} total={1500} unit="GB" width={"100%"} />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
                Notificaciones:{" "}
                <span style={{ fontFamily: T.fontMono, color: T.title }}>ops@agrocampo.com.co</span>
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: T.muted,
                  marginBottom: 6,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                SMS compañía
              </div>
              <UsageBar used={3200} total={10000} unit="msgs" width={"100%"} />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
                Umbral de alerta: <strong>90%</strong>
              </div>
            </div>
          </div>
        </Card>
      )}
      {!isTele2 && !isMoabits && (
        <Card title="Umbrales de tráfico · Kite">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            <KV label="thrReached (datos)" value="No alcanzado" color={T.success} />
            <KV label="trafficCut" value="Desactivado" />
          </div>
        </Card>
      )}
    </div>
  );
}

function TabAcciones({ r, src }: TabProps) {
  type ActionKey = "reactivate" | "network-reset" | "sync" | "purge";
  const actionsByStatus: Record<string, ActionKey[]> = {
    active: ["network-reset", "sync", "purge"],
    paused: ["reactivate", "sync", "purge"],
    overdue: ["reactivate", "sync", "purge"],
    canceled: ["reactivate"],
    pending: ["sync"],
    trial: ["network-reset", "sync", "purge"],
  };
  const available = actionsByStatus[r.status] ?? ["sync"];

  const ACT: Record<ActionKey, { title: string; body: string; color: string; icon: ReactNode; danger: boolean }> = {
    reactivate: {
      title: "Reactivar suscripción",
      body:
        "Restablece la línea al estado Activa. Internamente combina los endpoints de la fuente: " +
        (r.source === "kite"
          ? "Activate (Kite)"
          : r.source === "tele2"
            ? "Edit Device Status (Tele2)"
            : "Reactivate (Moabits)"),
      color: T.success,
      icon: <Icon.play size={12} />,
      danger: false,
    },
    "network-reset": {
      title: "Reset de red",
      body: "Cancela ubicación 2G/3G/4G y fuerza nueva attach. Solo disponible en Kite.",
      color: T.info,
      icon: <Icon.refresh size={13} />,
      danger: false,
    },
    sync: {
      title: "Sincronizar desde fuente",
      body: "Refresca los datos consultando " + src.name + " en tiempo real.",
      color: T.info,
      icon: <Icon.refresh size={13} />,
      danger: false,
    },
    purge: {
      title: "Purgar línea",
      body: "Acción destructiva. Marca la línea como PURGED en la fuente. No se puede deshacer fácilmente.",
      color: T.danger,
      icon: <Icon.close size={12} />,
      danger: true,
    },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
      <Card
        title="Acciones disponibles"
        right={
          <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono }}>
            según estado actual: {STATUS_META[r.status].label}
          </span>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {available.map((k) => {
            const a = ACT[k];
            return (
              <div
                key={k}
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
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: a.color + "22",
                    color: a.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {a.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.title, letterSpacing: -0.1 }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{a.body}</div>
                </div>
                <Btn variant={a.danger ? "danger" : "outline"} size="sm">
                  {a.danger ? "Confirmar…" : "Ejecutar"}
                </Btn>
              </div>
            );
          })}
        </div>
      </Card>
      <div>
        <Card title="Mapeo Bismark → fuente">
          <div style={{ fontSize: 11.5, fontFamily: T.fontMono, color: T.text, lineHeight: 1.8 }}>
            <div>
              <strong style={{ color: T.title }}>Reactivar</strong> · agrupa Activate / Edit status / Reactivate
            </div>
            <div>
              <strong style={{ color: T.title }}>Network reset</strong> · Kite networkReset
            </div>
            <div>
              <strong style={{ color: T.title }}>Purgar</strong> · Tele2 PURGED · Moabits purgeSims
            </div>
            <div>
              <strong style={{ color: T.title }}>Sincronizar</strong> · GET de la fuente
            </div>
          </div>
        </Card>
        <Card title="Bitácora reciente">
          <div style={{ fontSize: 12, color: T.text }}>
            {[
              { d: "2026-04-15 10:22", a: "Sincronización · sistema" },
              { d: "2026-03-22 14:08", a: "Reactivación · sofia.arias" },
              { d: "2026-02-08 16:44", a: "Auto-purga · sistema" },
            ].map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "6px 0",
                  borderBottom: i < 2 ? `1px solid ${T.rowDivider}` : "none",
                }}
              >
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted, width: 110, flexShrink: 0 }}>
                  {e.d}
                </span>
                <span style={{ flex: 1, fontSize: 12 }}>{e.a}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const TABS = [
  { id: "detalle", label: "Detalle" },
  { id: "estado", label: "Estado e historial" },
  { id: "consumo", label: "Consumo" },
  { id: "presencia", label: "Presencia y red" },
  { id: "limites", label: "Límites" },
  { id: "acciones", label: "Acciones" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SubscriptionPage({ record }: { record: SubscriptionRecord }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("detalle");
  const src = SOURCES[record.source];

  return (
    <div
      style={{
        background: T.pageBg,
        fontFamily: T.fontBody,
        color: T.text,
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      {/* Breadcrumb + URL bar */}
      <div
        style={{
          padding: "10px 24px",
          background: T.cardBg,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/dashboard/subscriptions")}
          style={{
            background: "transparent",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: T.fontBody,
            fontSize: 12,
          }}
        >
          <Icon.arrowLeft size={12} />
          Suscripciones
        </button>
        <span style={{ color: T.muted }}>/</span>
        <span style={{ fontFamily: T.fontMono, color: T.title, fontWeight: 600 }}>{record.id}</span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 11,
            color: T.muted,
            padding: "3px 8px",
            background: T.zebra,
            borderRadius: 4,
            border: `1px solid ${T.border}`,
          }}
        >
          /subscription/{record.id.toLowerCase()}
        </span>
      </div>

      {/* Hero header */}
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "20px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <SourceBadge source={record.source} size="sm" />
              <StatusPillWithNative
                status={record.status}
                nativeStatus={record.nativeStatus}
                sourceName={src.name}
                size="sm"
              />
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>·</span>
              <span style={{ fontSize: 12, color: T.muted }}>{record.parent}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.title, letterSpacing: -0.5 }}>
              {record.customer}
            </h1>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 3, fontFamily: T.fontMono }}>
              {record.customerEmail}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline" size="md" icon={<Icon.refresh size={13} />}>
              Sincronizar
            </Btn>
            <Btn variant="primary" size="md" icon={<Icon.play size={11} />}>
              Reactivar
            </Btn>
          </div>
        </div>

        <FocalHero r={record} src={src} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: -1, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "11px 16px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === t.id ? T.title : "transparent"}`,
                color: tab === t.id ? T.title : T.muted,
                fontFamily: T.fontBody,
                fontSize: 13,
                fontWeight: tab === t.id ? 700 : 500,
                cursor: "pointer",
                letterSpacing: -0.1,
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: 24 }}>
        {tab === "detalle" && <TabDetalle r={record} src={src} />}
        {tab === "estado" && <TabEstado r={record} src={src} />}
        {tab === "consumo" && <TabConsumo r={record} src={src} />}
        {tab === "presencia" && <TabPresencia r={record} src={src} />}
        {tab === "limites" && <TabLimites r={record} src={src} />}
        {tab === "acciones" && <TabAcciones r={record} src={src} />}
      </div>
    </div>
  );
}
