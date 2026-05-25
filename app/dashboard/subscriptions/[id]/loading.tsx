"use client";

import { useSearchParams } from "next/navigation";
import { Icon } from "../primitives";
import { SOURCES, SourceId, T } from "../tokens";

const SHIMMER_BG = `linear-gradient(90deg, ${T.divider}, ${T.zebra}, ${T.divider})`;

const DETAIL_LOADING_KEYFRAMES = `
@keyframes bismark-detail-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

type TabId = "detail" | "usage" | "presence" | "limits" | "actions";

const TABS: { id: TabId; label: string; loadingLabel: string }[] = [
  { id: "detail", label: "Resumen", loadingLabel: "Cargando resumen" },
  { id: "usage", label: "Consumo", loadingLabel: "Cargando consumo" },
  { id: "presence", label: "Presencia y red", loadingLabel: "Cargando presencia y red" },
  { id: "limits", label: "Límites", loadingLabel: "Cargando límites" },
  { id: "actions", label: "Acciones", loadingLabel: "Cargando acciones" },
];

function tabFrom(value: string | null): TabId {
  return TABS.some((tab) => tab.id === value) ? (value as TabId) : "detail";
}

function providerFrom(value: string | null): SourceId | null {
  return value && value in SOURCES ? (value as SourceId) : null;
}

function SkeletonLine({ width, height = 12 }: { width: number | string; height?: number }) {
  return (
    <div
      style={{
        width,
        maxWidth: "100%",
        height,
        borderRadius: 3,
        background: SHIMMER_BG,
        backgroundSize: "200% 100%",
        animation: "bismark-detail-shimmer 1.3s infinite",
      }}
    />
  );
}

function LoadingBanner({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, color: T.muted, fontSize: 12, fontWeight: 700 }}>
      <span
        style={{
          width: 13,
          height: 13,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          borderTopColor: "transparent",
          animation: "bismark-detail-spin 0.7s linear infinite",
        }}
      />
      {label}
    </div>
  );
}

function SummarySkeletonField({
  label,
  variant = "line",
}: {
  label: string;
  variant?: "line" | "badge" | "pill" | "long";
}) {
  return (
    <div style={{ background: T.cardBg, padding: "12px 16px", minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 7 }}>
        {label}
      </div>
      {variant === "badge" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SkeletonLine width={18} height={18} />
          <SkeletonLine width={64} height={12} />
        </div>
      ) : variant === "pill" ? (
        <SkeletonLine width={92} height={24} />
      ) : (
        <SkeletonLine width={variant === "long" ? "82%" : "62%"} height={14} />
      )}
    </div>
  );
}

function ActionRowSkeleton({ danger }: { danger?: boolean }) {
  return (
    <div style={{ padding: 16, borderTop: `1px solid ${T.divider}`, display: "flex", alignItems: "center", gap: 12 }}>
      <SkeletonLine width={36} height={36} />
      <div style={{ display: "grid", gap: 8, flex: 1, minWidth: 0 }}>
        <SkeletonLine width={danger ? 90 : 132} height={13} />
        <SkeletonLine width="76%" height={10} />
      </div>
      <SkeletonLine width={96} height={34} />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div style={{ borderTop: `1px solid ${T.divider}`, padding: 16, display: "grid", gap: 8, minHeight: 64 }}>
      <SkeletonLine width={82} height={10} />
      <SkeletonLine width="72%" height={13} />
    </div>
  );
}

function LoadingContent({ tab }: { tab: TabId }) {
  if (tab === "actions") {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, color: T.title, fontWeight: 800, fontSize: 13 }}>
            Cambiar estado
          </div>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            <SkeletonLine width="100%" height={38} />
            <SkeletonLine width={136} height={38} />
          </div>
        </section>
        <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, color: T.title, fontWeight: 800, fontSize: 13 }}>
            Acciones disponibles
          </div>
          <ActionRowSkeleton />
          <ActionRowSkeleton danger />
        </section>
      </div>
    );
  }

  if (tab === "usage") {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <CardSkeleton title="KPIs de consumo" cells={4} />
        <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, color: T.title, fontWeight: 800, fontSize: 13 }}>
            Periodo
          </div>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonLine key={index} width={`${90 - index * 6}%`} height={18} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (tab === "presence") {
    return <CardSkeleton title="Presencia y red" cells={6} />;
  }

  if (tab === "limits") {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <CardSkeleton title="Límites contractuales" cells={2} />
        <CardSkeleton title="Controles diarios" cells={4} />
        <CardSkeleton title="Controles mensuales" cells={4} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <CardSkeleton title="Plan" cells={8} />
      <CardSkeleton title="Cliente" cells={4} />
      <CardSkeleton title="Red" cells={8} />
      <CardSkeleton title="Hardware" cells={4} />
      <CardSkeleton title="Servicios" cells={4} />
      <CardSkeleton title="Límites" cells={4} />
    </div>
  );
}

function CardSkeleton({ title, cells = 4 }: { title: string; cells?: number }) {
  return (
    <section style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.divider}`, color: T.title, fontWeight: 800, fontSize: 13 }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {Array.from({ length: cells }).map((_, index) => (
          <FieldSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export default function SubscriptionDetailLoading() {
  const searchParams = useSearchParams();
  const activeTab = tabFrom(searchParams.get("tab"));
  const activeProvider = providerFrom(searchParams.get("provider"));
  const accent = activeProvider ? SOURCES[activeProvider].color : T.headerAccent;
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <main style={{ background: T.pageBg, color: T.text, fontFamily: T.fontBody, minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      <style>{`${DETAIL_LOADING_KEYFRAMES}
@keyframes bismark-detail-spin { to { transform: rotate(360deg); } }
`}</style>

      <div style={{ padding: "10px 24px", background: T.cardBg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.headerBg, fontWeight: 700 }}>
          <Icon.arrowLeft size={12} />
          Suscripciones
        </span>
        <span style={{ color: T.muted }}>/</span>
        <span style={{ color: T.title, fontWeight: 600 }}>Suscripción</span>
        <div style={{ flex: 1 }} />
        <SkeletonLine width={112} height={28} />
      </div>

      <section style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "20px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.7, fontWeight: 800, textTransform: "uppercase", marginBottom: 3 }}>
              {activeTab === "detail" ? "Resumen operativo" : activeTabMeta.label}
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: 0 }}>
              Suscripción SIM
            </h1>
            <LoadingBanner label={activeTabMeta.loadingLabel} color={accent} />
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            <SkeletonLine width={112} height={36} />
            <SkeletonLine width={92} height={36} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 1, background: T.border, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
          <SummarySkeletonField label="Fuente" variant="badge" />
          <SummarySkeletonField label="Estado" variant="pill" />
          <SummarySkeletonField label="ICCID" variant="long" />
          <SummarySkeletonField label="MSISDN" />
          <SummarySkeletonField label="IMSI" variant="long" />
          <SummarySkeletonField label="Plan" />
          <SummarySkeletonField label="Activado" />
          <SummarySkeletonField label="Actualizado" />
        </div>

        <nav style={{ display: "flex", gap: 2, marginBottom: -1, overflowX: "auto" }}>
          {TABS.map((item) => {
            const active = item.id === activeTab;
            return (
            <div
              key={item.id}
              style={{
                padding: "11px 16px",
                borderBottom: `2px solid ${active ? accent : "transparent"}`,
                color: active ? T.title : T.muted,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </div>
            );
          })}
        </nav>
      </section>

      <div style={{ flex: 1, padding: 24 }}>
        <LoadingContent tab={activeTab} />
      </div>
    </main>
  );
}
