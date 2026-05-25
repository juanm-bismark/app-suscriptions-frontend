"use client";

import { CSSProperties, ReactNode, useState } from "react";
import { SOURCES, STATUS_TONES, SourceId, T, nativeStatusMeta, statusToneForGroup } from "./tokens";

type IconProps = { size?: number };

export const Icon = {
  search: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3" />
    </svg>
  ),
  close: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  ),
  filter: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 3h12M4 8h8M6 13h4" />
    </svg>
  ),
  refresh: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v4h-4" />
      <path d="M2 13v-4h4" />
      <path d="M13.5 7a5.5 5.5 0 0 0-10-2L2 7" />
      <path d="M2.5 9a5.5 5.5 0 0 0 10 2L14 9" />
    </svg>
  ),
  warn: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L1.5 13.5h13L8 2z" />
      <path d="M8 6.5v3.5" />
      <circle cx="8" cy="12" r=".8" fill="currentColor" stroke="none" />
    </svg>
  ),
  play: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
      <path d="M3 2l7 4-7 4V2z" />
    </svg>
  ),
  pause: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor">
      <rect x="3" y="2" width="2.5" height="8" rx="0.4" />
      <rect x="6.5" y="2" width="2.5" height="8" rx="0.4" />
    </svg>
  ),
  plus: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 2v8M2 6h8" />
    </svg>
  ),
  copy: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <path d="M2 8V2a1 1 0 0 1 1-1h6" />
    </svg>
  ),
  arrowRight: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6h7M6.5 3l3 3-3 3" />
    </svg>
  ),
  arrowLeft: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 6h-7M5.5 3l-3 3 3 3" />
    </svg>
  ),
  chev: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  ),
  check: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.5L5 9l4.5-5.5" />
    </svg>
  ),
  history: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8a6 6 0 1 0 6-6M2 4v4h4" />
      <path d="M8 5v3l2 1.5" />
    </svg>
  ),
};

export function Avatar({
  name,
  size = 24,
  color = T.headerAccent,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color + "22",
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 700,
        letterSpacing: 0.2,
        fontFamily: T.fontBody,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function BismarkMark({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          background: light ? "#fff" : T.headerAccent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: light ? T.headerBg : "#fff",
          fontFamily: T.fontMono,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        b.
      </div>
      <div
        style={{
          fontFamily: T.fontBody,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: -0.3,
          color: light ? "#fff" : T.title,
        }}
      >
        bismark
      </div>
    </div>
  );
}

export function SourceBadge({
  source,
  size = "md",
  withName = false,
}: {
  source: SourceId;
  size?: "sm" | "md" | "lg";
  withName?: boolean;
}) {
  const s = SOURCES[source];
  if (!s) return null;
  const dim =
    size === "sm"
      ? { box: 18, fs: 10, gap: 6, label: 11.5 }
      : size === "lg"
        ? { box: 28, fs: 14, gap: 9, label: 13.5 }
        : { box: 22, fs: 11.5, gap: 7, label: 12.5 };
  const letter = s.name[0].toUpperCase();
  const glyph = (
    <span
      title={s.name}
      style={{
        width: dim.box,
        height: dim.box,
        borderRadius: 4,
        background: s.color,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: T.fontMono,
        fontSize: dim.fs,
        fontWeight: 700,
        letterSpacing: -0.5,
        flexShrink: 0,
      }}
    >
      {letter}
    </span>
  );
  if (!withName) return glyph;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: dim.gap,
        fontFamily: T.fontBody,
        color: T.title,
        fontSize: dim.label,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {glyph}
      {s.name}
    </span>
  );
}

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

export function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 4,
        border: `1px solid ${active ? color || T.headerBg : T.border}`,
        background: active ? color || T.headerBg : "#fff",
        color: active ? "#fff" : T.text,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: 0.1,
        fontFamily: T.fontBody,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

type BtnVariant = "primary" | "accent" | "danger" | "outline" | "ghost";

export function Btn({
  variant = "ghost",
  size = "md",
  icon,
  children,
  onClick,
  full,
  color,
  disabled,
  type = "button",
}: {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
  color?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const padMap: Record<string, string> = { sm: "5px 10px", md: "7px 12px", lg: "10px 16px" };
  const fsMap: Record<string, number> = { sm: 12, md: 13, lg: 14 };
  let style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: padMap[size],
    borderRadius: 4,
    fontSize: fsMap[size],
    fontWeight: 600,
    fontFamily: T.fontBody,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    flex: full ? "1 1 0" : undefined,
    width: full ? "100%" : undefined,
    whiteSpace: "nowrap",
    letterSpacing: 0.1,
    transition: "background .12s, border-color .12s",
  };
  if (variant === "primary") {
    style = { ...style, background: color || T.headerBg, color: "#fff", border: `1px solid ${color || T.headerBg}` };
  } else if (variant === "accent") {
    style = { ...style, background: T.headerAccent, color: "#fff", border: `1px solid ${T.headerAccent}` };
  } else if (variant === "danger") {
    style = { ...style, background: "#fff", color: T.danger, border: `1px solid ${T.danger}66` };
  } else if (variant === "outline") {
    style = { ...style, background: "#fff", color: T.text, border: `1px solid ${T.border}` };
  } else {
    style = { ...style, background: "transparent", color: T.text, border: "1px solid transparent" };
  }
  return (
    <button onClick={onClick} disabled={disabled} type={type} style={style}>
      {icon}
      {children}
    </button>
  );
}
