"use client";

import { useState } from "react";
import { STATUS_TONES, type SourceId, T, nativeStatusMeta, statusToneForGroup } from "../tokens";

export { SourceBadge } from "@/app/dashboard/_components/source-badge";

export function StatusPillWithNative({
  provider,
  status,
  nativeStatus,
  displayLabel,
  statusGroup,
  sourceName,
  showContext = true,
  size = "sm",
}: {
  provider: SourceId;
  status?: string | null;
  nativeStatus?: string;
  displayLabel?: string | null;
  statusGroup?: string | null;
  sourceName?: string;
  showContext?: boolean;
  size?: "sm" | "md";
}) {
  const [hov, setHov] = useState(false);
  const rawStatus = nativeStatus || status || "";
  const meta = nativeStatusMeta(provider, rawStatus);
  const tone = STATUS_TONES[statusGroup ? statusToneForGroup(statusGroup) : meta.tone];
  const label = displayLabel?.trim() || meta.label;
  const context = sourceName ?? "Estado";
  const pad = size === "sm" ? { h: 7, v: 3, fs: 11.5, ctx: 10.5 } : { h: 9, v: 4, fs: 12.5, ctx: 11 };
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: `${pad.v}px ${pad.h}px`,
          borderRadius: 3,
          background: tone.bg,
          color: tone.color,
          fontSize: pad.fs,
          fontWeight: 700,
          letterSpacing: 0,
          fontFamily: T.fontBody,
          whiteSpace: "nowrap",
          border: `1px solid ${tone.dot}33`,
          maxWidth: size === "sm" ? 118 : 160,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      {showContext && (
        <span
          style={{
            color: T.muted,
            fontSize: pad.ctx,
            fontWeight: 700,
            fontFamily: T.fontBody,
            whiteSpace: "nowrap",
            maxWidth: size === "sm" ? 74 : 110,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {context}
        </span>
      )}
      {hov && rawStatus && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            zIndex: 30,
            background: T.headerTopBg,
            color: "#fff",
            padding: "6px 9px",
            borderRadius: 4,
            fontSize: 10.5,
            fontFamily: T.fontMono,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,.18)",
            pointerEvents: "none",
          }}
        >
          {context}:{" "}
          <span style={{ color: T.headerClientText }}>{rawStatus}</span>
        </span>
      )}
    </span>
  );
}

export function UsageBar({
  used,
  total,
  unit = "GB",
  width = 110,
  compact = false,
}: {
  used: number | null | undefined;
  total: number | null | undefined;
  unit?: string;
  width?: number | string;
  compact?: boolean;
}) {
  if (used == null) return <span style={{ color: T.muted, fontSize: 11.5 }}>—</span>;
  if (total == null) {
    return (
      <div style={{ width, fontFamily: T.fontMono, fontSize: 11, color: T.muted }}>
        <div style={{ color: T.title, fontWeight: 600, fontSize: 11.5, marginBottom: 2 }}>
          {used.toLocaleString("es-CO")} {unit}
        </div>
        <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.2 }}>sin tope</div>
      </div>
    );
  }
  const pct = Math.min(100, Math.max(0, (used / total) * 100));
  const color = pct >= 90 ? T.danger : pct >= 70 ? T.warning : T.success;
  const trackBg = "#E6ECEC";
  return (
    <div style={{ width, fontFamily: T.fontMono }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ color: T.title, fontWeight: 600, fontSize: 11.5 }}>
          {used.toLocaleString("es-CO")}
          <span style={{ color: T.muted, fontWeight: 500 }}>
            {" "}
            / {total} {unit}
          </span>
        </span>
        {!compact && (
          <span style={{ fontSize: 10, color, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
        )}
      </div>
      <div style={{ width: "100%", height: 4, borderRadius: 2, background: trackBg, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}
