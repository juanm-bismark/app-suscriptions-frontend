"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "../primitives";
import { SOURCES, SourceId, T } from "../tokens";

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
      className="skeleton-shimmer rounded-[3px]"
      style={{ width, maxWidth: "100%", height }}
    />
  );
}

function LoadingBanner({ label, color }: { label: string; color: string }) {
  return (
    <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-muted">
      <span
        className="h-[13px] w-[13px] animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: color, borderTopColor: "transparent" }}
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
    <div className="min-w-0 bg-card px-4 py-3">
      <div className="mb-[7px] text-[10px] font-bold uppercase tracking-[1px] text-muted">
        {label}
      </div>
      {variant === "badge" ? (
        <div className="flex items-center gap-2">
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
    <div className="flex items-center gap-3 border-t border-divider p-4">
      <SkeletonLine width={36} height={36} />
      <div className="grid min-w-0 flex-1 gap-2">
        <SkeletonLine width={danger ? 90 : 132} height={13} />
        <SkeletonLine width="76%" height={10} />
      </div>
      <SkeletonLine width={96} height={34} />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="grid min-h-16 gap-2 border-t border-divider p-4">
      <SkeletonLine width={82} height={10} />
      <SkeletonLine width="72%" height={13} />
    </div>
  );
}

function LoadingContent({ tab }: { tab: TabId }) {
  if (tab === "actions") {
    return (
      <div className="grid gap-3.5">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-divider px-4 py-[13px] text-[13px] font-extrabold text-title">
            Cambiar estado
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3 p-4">
            <SkeletonLine width="100%" height={38} />
            <SkeletonLine width={136} height={38} />
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-divider px-4 py-[13px] text-[13px] font-extrabold text-title">
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
      <div className="grid gap-3.5">
        <CardSkeleton title="KPIs de consumo" cells={4} />
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-divider px-4 py-[13px] text-[13px] font-extrabold text-title">
            Periodo
          </div>
          <div className="grid gap-2.5 p-4">
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
      <div className="grid gap-3.5">
        <CardSkeleton title="Límites contractuales" cells={2} />
        <CardSkeleton title="Controles diarios" cells={4} />
        <CardSkeleton title="Controles mensuales" cells={4} />
      </div>
    );
  }

  return (
    <div className="grid gap-3.5">
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
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-divider px-4 py-[13px] text-[13px] font-extrabold text-title">
        {title}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
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
    <main className="flex min-h-[calc(100vh-64px)] flex-col bg-page font-body text-text">
      <div className="flex items-center gap-2.5 border-b border-border bg-card px-6 py-2.5 text-xs">
        <span className="inline-flex items-center gap-[5px] font-bold text-header-bg">
          <Icon.arrowLeft size={12} />
          Suscripciones
        </span>
        <span className="text-muted">/</span>
        <span className="font-semibold text-title">Suscripción</span>
        <div className="flex-1" />
        <SkeletonLine width={112} height={28} />
      </div>

      <section className="border-b border-border bg-card px-6 pt-5">
        <div className="mb-[18px] flex flex-wrap items-start gap-[18px]">
          <div className="min-w-[260px] flex-1">
            <div className="mb-[3px] text-[10.5px] font-extrabold uppercase tracking-[0.7px] text-muted">
              {activeTab === "detail" ? "Resumen operativo" : activeTabMeta.label}
            </div>
            <h1 className="m-0 text-[22px] font-bold text-title">
              Suscripción SIM
            </h1>
            <LoadingBanner label={activeTabMeta.loadingLabel} color={accent} />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <SkeletonLine width={112} height={36} />
            <SkeletonLine width={92} height={36} />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-md bg-border">
          <SummarySkeletonField label="Fuente" variant="badge" />
          <SummarySkeletonField label="Estado" variant="pill" />
          <SummarySkeletonField label="ICCID" variant="long" />
          <SummarySkeletonField label="MSISDN" />
          <SummarySkeletonField label="IMSI" variant="long" />
          <SummarySkeletonField label="Plan" />
          <SummarySkeletonField label="Activado" />
          <SummarySkeletonField label="Actualizado" />
        </div>

        <nav className="mb-[-1px] flex gap-0.5 overflow-x-auto">
          {TABS.map((item) => {
            const active = item.id === activeTab;
            return (
              <div
                key={item.id}
                className={cn(
                  "whitespace-nowrap border-b-2 px-4 py-[11px] text-[13px]",
                  active ? "font-bold text-title" : "border-transparent font-medium text-muted"
                )}
                style={active ? { borderBottomColor: accent } : undefined}
              >
                {item.label}
              </div>
            );
          })}
        </nav>
      </section>

      <div className="flex-1 p-6">
        <LoadingContent tab={activeTab} />
      </div>
    </main>
  );
}
