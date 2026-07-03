"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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
      className="relative inline-flex min-w-0 items-center gap-[7px]"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span
        className={cn(
          "inline-flex items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[3px] border font-bold",
          size === "sm" ? "max-w-[118px]" : "max-w-[160px]"
        )}
        style={{
          padding: `${pad.v}px ${pad.h}px`,
          background: tone.bg,
          color: tone.color,
          fontSize: pad.fs,
          borderColor: `${tone.dot}33`,
        }}
      >
        {label}
      </span>
      {showContext && (
        <span
          className={cn(
            "overflow-hidden text-ellipsis whitespace-nowrap font-bold text-muted",
            size === "sm" ? "max-w-[74px]" : "max-w-[110px]"
          )}
          style={{ fontSize: pad.ctx }}
        >
          {context}
        </span>
      )}
      {hov && rawStatus && (
        <span
          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-30 whitespace-nowrap rounded font-mono text-[10.5px] text-white shadow-[0_4px_12px_rgba(0,0,0,.18)]"
          style={{ background: T.headerTopBg, padding: "6px 9px" }}
        >
          {context}:{" "}
          <span className="text-header-client">{rawStatus}</span>
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
  if (used == null) return <span className="text-[11.5px] text-muted">—</span>;
  if (total == null) {
    return (
      <div className="font-mono text-xs text-muted" style={{ width }}>
        <div className="mb-0.5 text-[11.5px] font-semibold text-title">
          {used.toLocaleString("es-CO")} {unit}
        </div>
        <div className="text-[10.5px] tracking-[0.2px] text-muted">sin tope</div>
      </div>
    );
  }
  const pct = Math.min(100, Math.max(0, (used / total) * 100));
  const color = pct >= 90 ? T.danger : pct >= 70 ? T.warning : T.success;
  return (
    <div className="font-mono" style={{ width }}>
      <div className="mb-[3px] flex items-baseline justify-between">
        <span className="text-[11.5px] font-semibold text-title">
          {used.toLocaleString("es-CO")}
          <span className="font-medium text-muted">
            {" "}
            / {total} {unit}
          </span>
        </span>
        {!compact && (
          <span className="text-[10px] font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
        )}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-sm bg-[#E6ECEC]">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
