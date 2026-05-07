"use client";

import type { SubscriptionRow } from "@/lib/api/sim-mapper";
import { useRouter } from "next/navigation";
import { fmtShortDate } from "./data";
import { Btn, Icon, SourceBadge, StatusPill } from "./primitives";
import { SOURCES, T } from "./tokens";

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
      <div style={{ fontSize: 10.5, letterSpacing: 0.6, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
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
  record: SubscriptionRow | null;
  onClose: () => void;
}

function value(v: string | null | undefined) {
  return v && v.trim() ? v : "—";
}

export function DetailModal({ record, onClose }: DetailModalProps) {
  const router = useRouter();
  if (!record) return null;
  const src = SOURCES[record.provider];

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
        <div style={{ position: "relative", background: T.cardBg, padding: "18px 22px 16px", borderBottom: `1px solid ${T.divider}` }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: src.color }} />
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ position: "absolute", top: 14, right: 14, background: "transparent", border: "none", color: T.muted, padding: 6, borderRadius: 4, cursor: "pointer" }}
          >
            <Icon.close size={15} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 4 }}>
            <SourceBadge source={record.provider} size="sm" withName />
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>·</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>{record.iccid}</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, paddingLeft: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: -0.4 }}>{value(record.customerName)}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2, fontFamily: T.fontMono }}>{value(record.customerScope)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <StatusPill status={record.status} size="md" />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontFamily: T.fontMono }}>
                Act. {fmtShortDate(record.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${T.divider}` }}>
            <ModalStat label="Plan" value={value(record.planName)} sub={value(record.planCode)} />
            <ModalStat label="MSISDN" value={value(record.msisdn)} mono divider />
            <ModalStat label="IMSI" value={value(record.imsi)} mono divider />
          </div>

          <div style={{ padding: "16px 22px", display: "grid", gap: 10 }}>
            <ModalStat label="ICCID" value={record.iccid} mono />
            <ModalStat label="Estado nativo" value={value(record.nativeStatus)} mono />
            <ModalStat label="Nivel de detalle" value={record.detailLevel} mono />
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, background: T.tableHeaderBg, padding: "12px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <Btn variant="ghost" size="md" icon={<Icon.copy size={12} />}>
            Copiar ICCID
          </Btn>
          <Btn
            variant="outline"
            size="md"
            onClick={() => {
              onClose();
              router.push(`/dashboard/subscriptions/${encodeURIComponent(record.iccid)}?tab=actions`);
            }}
          >
            Acciones
          </Btn>
          <div style={{ flex: 1 }} />
          <Btn
            variant="primary"
            size="md"
            onClick={() => {
              onClose();
              router.push(`/dashboard/subscriptions/${encodeURIComponent(record.iccid)}`);
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
