"use client";

import { usePathname } from "next/navigation";
import { Icon } from "../primitives";
import { T } from "../tokens";

const SHIMMER_BG = `linear-gradient(90deg, ${T.divider}, ${T.zebra}, ${T.divider})`;

const DETAIL_LOADING_KEYFRAMES = `
@keyframes bismark-detail-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

function SkeletonLine({ width, height = 12 }: { width: number | string; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 3,
        background: SHIMMER_BG,
        backgroundSize: "200% 100%",
        animation: "bismark-detail-shimmer 1.3s infinite",
      }}
    />
  );
}

function SkeletonBox({ height = 44 }: { height?: number }) {
  return (
    <div
      style={{
        minHeight: height,
        borderTop: `1px solid ${T.divider}`,
        padding: 16,
        display: "grid",
        gap: 8,
      }}
    >
      <SkeletonLine width={82} height={10} />
      <SkeletonLine width="70%" />
    </div>
  );
}

export default function SubscriptionDetailLoading() {
  const pathname = usePathname();
  const iccid = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "ICCID");

  return (
    <main style={{ background: T.pageBg, color: T.text, fontFamily: T.fontBody, minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      <style>{DETAIL_LOADING_KEYFRAMES}</style>

      <div style={{ padding: "10px 24px", background: T.cardBg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.headerBg }}>
          <Icon.arrowLeft size={12} />
          Suscripciones
        </span>
        <span>/</span>
        <span style={{ color: T.title, fontFamily: T.fontMono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {iccid}
        </span>
        <div style={{ flex: 1 }} />
        <SkeletonLine width={86} height={26} />
        <SkeletonLine width={180} height={24} />
      </div>

      <section style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "20px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              {[0, 1, 2].map((item) => (
                <div key={item} style={{ minHeight: 34, display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 9px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.zebra }}>
                  <SkeletonLine width={48} height={10} />
                  <SkeletonLine width={item === 0 ? 72 : 58} height={14} />
                </div>
              ))}
            </div>
            <SkeletonLine width={42} height={10} />
            <div style={{ marginTop: 6 }}>
              <SkeletonLine width="min(100%, 360px)" height={27} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
              <SkeletonLine width={132} height={24} />
              <SkeletonLine width={112} height={24} />
              <SkeletonLine width={112} height={24} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <SkeletonLine width={112} height={36} />
            <SkeletonLine width={92} height={36} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 1, background: T.border, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            item < 4 ? (
              <div key={item} style={{ background: T.cardBg, padding: "12px 16px", display: "grid", gap: 7 }}>
                <SkeletonLine width={74} height={10} />
                <SkeletonLine width="70%" height={14} />
                <SkeletonLine width="45%" height={10} />
              </div>
            ) : null
          ))}
        </div>

        <nav style={{ display: "flex", gap: 2, marginBottom: -1, overflow: "hidden" }}>
          {["Detalle", "Estado e historial", "Consumo", "Presencia y red", "Límites", "Acciones"].map((label, index) => (
            <div
              key={label}
              style={{
                padding: "11px 16px",
                borderBottom: `2px solid ${index === 0 ? T.headerAccent : "transparent"}`,
                color: index === 0 ? T.title : T.muted,
                fontSize: 13,
                fontWeight: index === 0 ? 700 : 500,
              }}
            >
              {label}
            </div>
          ))}
        </nav>
      </section>

      <div style={{ flex: 1, padding: 24 }}>
        <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.divider}` }}>
            <SkeletonLine width={180} height={16} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
              <SkeletonBox key={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
