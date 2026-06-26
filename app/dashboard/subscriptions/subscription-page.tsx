"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger, toast } from "@/components/ui";
import type { ProviderCapabilitiesOut, SubscriptionOut } from "@/lib/types/api";
import type { UserRole } from "@/lib/types/user";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fmtDate } from "./data";
import { Btn, Icon, SourceBadge, StatusPillWithNative } from "./primitives";
import { ActionsTab } from "./detail/actions-tab";
import { DetailTab } from "./detail/detail-tab";
import { downloadProviderFields } from "./detail/export";
import { LimitsTab } from "./detail/limits-tab";
import { PresenceTab } from "./detail/presence-tab";
import { SummaryField } from "./detail/primitives";
import { UsageTab } from "./detail/usage-tab";
import { clean, planDisplay, subscriptionStatusInfo, value, type TabId } from "./detail/utils";
import { SOURCES, T } from "./tokens";

const TABS: { id: TabId; label: string }[] = [
  { id: "detail", label: "Resumen" },
  { id: "usage", label: "Consumo" },
  { id: "presence", label: "Presencia y red" },
  { id: "limits", label: "Límites" },
  { id: "actions", label: "Acciones" },
];

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
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [copiedIccid, setCopiedIccid] = useState(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const src = SOURCES[subscription.provider];
  const n = subscription.normalized;
  const statusInfo = subscriptionStatusInfo(subscription);

  function refreshPage() {
    startRefreshTransition(() => router.refresh());
  }

  async function copyIccid() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(subscription.iccid);
      } else {
        const input = document.createElement("textarea");
        input.value = subscription.iccid;
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setCopiedIccid(true);
      toast.success("ICCID copiado");
      window.setTimeout(() => setCopiedIccid(false), 1600);
    } catch {
      toast.error("No pudimos copiar el ICCID");
    }
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as TabId)}
      className="gap-0"
      style={{ background: T.pageBg, color: T.text, fontFamily: T.fontBody, minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}
    >
      {/* Breadcrumb bar */}
      <div style={{ padding: "10px 24px", background: T.cardBg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
        <Link
          href="/dashboard/subscriptions"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, color: T.headerBg, textDecoration: "none", fontWeight: 700 }}
        >
          <Icon.arrowLeft size={12} />
          Suscripciones
        </Link>
        <span style={{ color: T.muted }}>/</span>
        <span style={{ color: T.title, fontWeight: 600 }}>
          Suscripción
        </span>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" size="sm" icon={<Icon.copy size={12} />} onClick={copyIccid}>
          {copiedIccid ? "Copiado" : "Copiar ICCID"}
        </Btn>
      </div>

      {/* Hero section */}
      <div style={{ background: T.cardBg, borderBottom: `1px solid ${T.border}`, padding: "20px 24px 0" }}>
        {/* Avatar + info + actions */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: T.muted, fontSize: 10.5, letterSpacing: 0.7, fontWeight: 800, textTransform: "uppercase", marginBottom: 3 }}>Resumen operativo</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.title, letterSpacing: 0 }}>
              Suscripción SIM
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {subscription.provider === "moabits" && (
              <Btn
                variant="ghost"
                size="md"
                icon={<Icon.download size={13} />}
                onClick={() => downloadProviderFields(subscription)}
              >
                Exportar data v2
              </Btn>
            )}
            <Btn
              variant="outline"
              size="md"
              icon={isRefreshing ? <Loader2 size={13} className="animate-spin" /> : <Icon.refresh size={13} />}
              onClick={refreshPage}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Sincronizando..." : "Sincronizar"}
            </Btn>
            <Btn variant="primary" size="md" color={src.color} onClick={() => setTab("actions")}>
              Acciones
            </Btn>
          </div>
        </div>

        {/* Canonical summary strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 1, background: T.border, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
          <SummaryField label="Fuente">
            <SourceBadge source={subscription.provider} size="sm" withName />
          </SummaryField>
          <SummaryField label="Estado">
            <StatusPillWithNative
              provider={subscription.provider}
              status={statusInfo.value}
              nativeStatus={statusInfo.value}
              displayLabel={statusInfo.value}
              statusGroup={statusInfo.group}
              showContext={false}
              size="sm"
            />
          </SummaryField>
          <SummaryField label="ICCID" mono preserveValue>{subscription.iccid}</SummaryField>
          <SummaryField label="MSISDN" mono>{value(subscription.msisdn)}</SummaryField>
          <SummaryField label="IMSI" mono>{value(subscription.imsi)}</SummaryField>
          <SummaryField label="Plan" sub={clean(n.plan.name) ? clean(n.plan.code) ?? clean(n.plan.id) : undefined}>{planDisplay(n.plan)}</SummaryField>
          <SummaryField label="Activado">{fmtDate(subscription.activated_at)}</SummaryField>
          <SummaryField label="Actualizado">{fmtDate(subscription.updated_at)}</SummaryField>
        </div>

        {/* Underline tabs */}
        <TabsList className="flex h-auto items-end gap-0 rounded-none bg-transparent p-0" style={{ marginBottom: -1 }}>
          {TABS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-[11px] shadow-none ring-offset-card data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              style={{
                borderBottom: `2px solid ${tab === item.id ? src.color : "transparent"}`,
                color: tab === item.id ? T.title : T.muted,
                fontFamily: T.fontBody,
                fontSize: 13,
                fontWeight: tab === item.id ? 700 : 500,
                letterSpacing: 0,
              }}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: 24 }}>
        <TabsContent value="detail" className="mt-0 focus-visible:outline-none">
          <DetailTab subscription={subscription} capabilities={capabilities} />
        </TabsContent>
        <TabsContent value="usage" className="mt-0 focus-visible:outline-none">
          <UsageTab subscription={subscription} />
        </TabsContent>
        <TabsContent value="presence" className="mt-0 focus-visible:outline-none">
          <PresenceTab subscription={subscription} capabilities={capabilities} />
        </TabsContent>
        <TabsContent value="limits" className="mt-0 focus-visible:outline-none">
          <LimitsTab subscription={subscription} />
        </TabsContent>
        <TabsContent value="actions" className="mt-0 focus-visible:outline-none">
          <ActionsTab
            subscription={subscription}
            capabilities={capabilities}
            currentUserRole={currentUserRole}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
