"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { fmtCOP, fmtShortDate, SubscriptionRecord } from "./data";
import { Btn, Icon, SourceBadge, StatusPill, UsageBar } from "./primitives";
import { SOURCES, T } from "./tokens";

interface QuickAction {
  label: string;
  icon: ReactNode;
  danger?: boolean;
}

function modalQuickActions(r: SubscriptionRecord): QuickAction[] {
  if (r.status === "overdue") {
    return [
      { label: "Reactivar", icon: <Icon.play size={11} /> },
      { label: "Generar cobro", icon: <Icon.refresh size={12} /> },
      { label: "Ver facturas", icon: <Icon.copy size={12} /> },
    ];
  }
  if (r.status === "paused") {
    return [
      { label: "Reanudar", icon: <Icon.play size={11} /> },
      { label: "Cambiar plan", icon: <Icon.refresh size={12} /> },
      { label: "Cancelar", icon: <Icon.warn size={12} />, danger: true },
    ];
  }
  return [
    { label: "Pausar", icon: <Icon.pause size={12} /> },
    { label: "Cambiar plan", icon: <Icon.refresh size={12} /> },
    { label: "Ver facturas", icon: <Icon.copy size={12} /> },
  ];
}

interface SimpleEvent {
  date: string;
  text: string;
  actor: string;
}

function sampleHistory(r: SubscriptionRecord): SimpleEvent[] {
  return [
    { date: fmtShortDate("2026-04-15"), text: "Factura generada · " + fmtCOP(r.amount), actor: "sistema" },
    { date: fmtShortDate("2026-03-22"), text: "Sincronización manual con " + SOURCES[r.source].name, actor: "sofia.arias" },
    { date: fmtShortDate("2026-02-08"), text: "Plan actualizado a " + r.plan, actor: "sofia.arias" },
  ];
}

interface Invoice {
  date: string;
  amount: number;
  paid: boolean;
}

function sampleInvoices(r: SubscriptionRecord): Invoice[] {
  const dates = ["15 abr", "15 mar", "15 feb", "15 ene"];
  return dates.map((d, i) => ({
    date: d,
    amount: r.amount,
    paid: r.status === "overdue" ? i > 0 : true,
  }));
}

function ModalStat({
  label,
  value,
  sub,
  mono,
  divider,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  divider?: boolean;
}) {
  return (
    <div style={{ padding: "12px 16px", borderLeft: divider ? `1px solid ${T.divider}` : "none", minWidth: 0 }}>
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
          fontSize: 14,
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

export interface DetailModalProps {
  record: SubscriptionRecord | null;
  onClose: () => void;
}

export function DetailModal({ record, onClose }: DetailModalProps) {
  const router = useRouter();
  if (!record) return null;
  const src = SOURCES[record.source];
  const invoices = sampleInvoices(record);
  const events = sampleHistory(record);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15, 32, 42, 0.55)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          background: T.cardBg,
          borderRadius: 8,
          boxShadow: "0 20px 60px rgba(15, 32, 42, 0.25), 0 2px 8px rgba(15, 32, 42, 0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: `1px solid ${T.border}`,
          fontFamily: T.fontBody,
        }}
      >
        {/* HEADER */}
        <div style={{ position: "relative", background: T.cardBg, padding: "18px 22px 16px", borderBottom: `1px solid ${T.divider}` }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: src.color }} />
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "transparent",
              border: "none",
              color: T.muted,
              padding: 6,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            <Icon.close size={15} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
            <SourceBadge source={record.source} size="sm" withName />
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>·</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>{record.id}</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, paddingLeft: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: -0.4 }}>{record.customer}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2, fontFamily: T.fontMono }}>{record.customerEmail}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <StatusPill status={record.status} size="md" />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontFamily: T.fontMono }}>
                Desde {fmtShortDate(record.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${T.divider}` }}>
            <ModalStat label="Plan" value={record.plan} sub={record.cycle} />
            <ModalStat label="Monto" value={fmtCOP(record.amount)} sub="por ciclo" mono divider />
            <ModalStat label="Renovación" value={fmtShortDate(record.nextRenewal)} sub={record.cycle.toLowerCase()} divider />
          </div>

          {record.usage && (
            <div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.divider}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    letterSpacing: 0.6,
                    color: T.muted,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Consumo del ciclo
                </span>
                {record.usage.total != null && (
                  <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.title, fontWeight: 600 }}>
                    {record.usage.used.toLocaleString("es-CO")} / {record.usage.total} {record.usage.unit}
                  </span>
                )}
              </div>
              <UsageBar used={record.usage.used} total={record.usage.total} unit={record.usage.unit} width={"100%"} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${T.divider}` }}>
            <div style={{ padding: "14px 18px 14px 22px", borderRight: `1px solid ${T.divider}` }}>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: 0.6,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Actividad reciente
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {events.slice(0, 3).map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: i === 0 ? src.color : T.muted,
                          flexShrink: 0,
                        }}
                      />
                      {i < 2 && (
                        <span style={{ width: 1, flex: 1, minHeight: 16, background: T.divider, marginTop: 3 }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: T.title, fontWeight: 500, lineHeight: 1.35 }}>{e.text}</div>
                      <div style={{ fontSize: 10.5, color: T.muted, fontFamily: T.fontMono, marginTop: 2 }}>
                        {e.date} · {e.actor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "14px 22px 14px 18px" }}>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: 0.6,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Últimas facturas
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {invoices.map((inv, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: inv.paid ? T.success : T.warning,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted, width: 56 }}>{inv.date}</span>
                    <span style={{ flex: 1, fontFamily: T.fontMono, fontSize: 12, color: T.title, fontWeight: 600 }}>
                      {fmtCOP(inv.amount)}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: inv.paid ? T.success : T.warning,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                      }}
                    >
                      {inv.paid ? "Pagada" : "Pendiente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 22px" }}>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: 0.6,
                color: T.muted,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Acciones rápidas
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {modalQuickActions(record).map((a, i) => (
                <button
                  key={i}
                  type="button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 4,
                    background: "#fff",
                    border: `1px solid ${T.border}`,
                    fontSize: 12,
                    fontFamily: T.fontBody,
                    fontWeight: 600,
                    color: a.danger ? T.danger : T.title,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: a.danger ? T.danger : src.color, display: "inline-flex" }}>{a.icon}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            borderTop: `1px solid ${T.border}`,
            background: T.tableHeaderBg,
            padding: "12px 22px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Btn variant="ghost" size="md" icon={<Icon.copy size={12} />}>
            Copiar ID
          </Btn>
          <Btn variant="ghost" size="md" icon={<Icon.refresh size={13} />}>
            Sincronizar
          </Btn>
          <Btn variant="danger" size="md" icon={<Icon.warn size={12} />}>
            Purgar
          </Btn>
          <div style={{ flex: 1 }} />
          <Btn
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              router.push(`/dashboard/subscriptions/${encodeURIComponent(record.id)}`);
            }}
            icon={<Icon.arrowRight size={12} />}
          >
            Ver detalle completo
          </Btn>
        </div>
      </div>
    </div>
  );
}
