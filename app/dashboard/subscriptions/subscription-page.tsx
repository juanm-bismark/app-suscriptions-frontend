"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger, toast } from "@/components/ui";
import type { ProviderCapabilitiesOut, SubscriptionOut } from "@/lib/types/api";
import type { UserRole } from "@/lib/types/user";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
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
import { SOURCES } from "./tokens";

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
      className="flex min-h-[calc(100vh-64px)] flex-col gap-0 bg-page font-body text-text"
    >
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2.5 border-b border-border bg-card px-6 py-2.5 text-xs">
        <Link
          href="/dashboard/subscriptions"
          className="inline-flex items-center gap-[5px] font-bold text-header-bg no-underline"
        >
          <Icon.arrowLeft size={12} />
          Suscripciones
        </Link>
        <span className="text-muted">/</span>
        <span className="font-semibold text-title">
          Suscripción
        </span>
        <div className="flex-1" />
        <Btn variant="ghost" size="sm" icon={<Icon.copy size={12} />} onClick={copyIccid}>
          {copiedIccid ? "Copiado" : "Copiar ICCID"}
        </Btn>
      </div>

      {/* Hero section */}
      <div className="border-b border-border bg-card px-6 pt-5">
        {/* Avatar + info + actions */}
        <div className="mb-[18px] flex items-start gap-[18px]">
          <div className="min-w-0 flex-1">
            <div className="mb-[3px] text-[10.5px] font-extrabold uppercase tracking-[0.7px] text-muted">Resumen operativo</div>
            <h1 className="m-0 text-[22px] font-bold text-title">
              Suscripción SIM
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
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
        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-md bg-border">
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
        <TabsList className="mb-[-1px] flex h-auto items-end gap-0 rounded-none bg-transparent p-0">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className={cn(
                  "rounded-none border-b-2 bg-transparent px-4 py-[11px] font-body text-[13px] shadow-none ring-offset-card data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                  active ? "font-bold text-title" : "border-transparent font-medium text-muted"
                )}
                style={active ? { borderBottomColor: src.color } : undefined}
              >
                {item.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6">
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
