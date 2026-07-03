"use client"

import { newIdempotencyKey } from "@/lib/api/idempotency"
import { setSimStatus } from "@/lib/api/sims"
import { toast } from "@/components/ui"
import type { ProviderCapabilitiesOut, SubscriptionOut } from "@/lib/types/api"
import { ROLES, type UserRole } from "@/lib/types/user"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import { Icon } from "../primitives"
import { SOURCES, T } from "../tokens"
import { Empty } from "./primitives"
import { actionErrorMessage, purgeBodyFor, subscriptionStatusInfo } from "./utils"
import { ActionRow } from "./actions/action-row"
import { ConfirmationDialog } from "./actions/confirmation-dialog"
import { StatusChangeRow } from "./actions/status-change-row"
import type { ActionDef, ActionKey, PendingAction } from "./actions/types"

export function ActionsTab({
  subscription,
  capabilities,
  currentUserRole,
}: {
  subscription: SubscriptionOut
  capabilities: ProviderCapabilitiesOut
  currentUserRole?: UserRole
}) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const src = SOURCES[subscription.provider]
  const isAdmin = currentUserRole === ROLES.ADMIN
  const statusCapability = capabilities.capabilities.set_administrative_status
  const targets = useMemo(() => statusCapability?.targets ?? [], [statusCapability?.targets])
  const currentStatus = subscriptionStatusInfo(subscription)
  const purgeCapability = capabilities.capabilities.purge
  const canPurge = purgeCapability?.status === "supported"
  const canChangeStatus = statusCapability?.status === "supported" && targets.length > 0

  const [pending, setPending] = useState<PendingAction | null>(null)
  const [selectedTarget, setSelectedTarget] = useState(targets[0] ?? "")
  const [busy, setBusy] = useState(false)
  const [awaitingSync, setAwaitingSync] = useState(false)

  useEffect(() => {
    if (!awaitingSync || isRefreshing) return
    const id = window.setTimeout(() => {
      setAwaitingSync(false)
      toast.success(`Datos refrescados desde ${src.name}.`)
    }, 0)
    return () => window.clearTimeout(id)
  }, [awaitingSync, isRefreshing, src.name])

  const effectiveTarget = targets.includes(selectedTarget) ? selectedTarget : targets[0] ?? ""
  const isMoabitsServiceTarget =
    subscription.provider === "moabits" &&
    pending?.kind === "status" &&
    (pending.target.toLowerCase() === "active" || pending.target.toLowerCase() === "suspended")
  const servicesValid = !isMoabitsServiceTarget || (pending?.kind === "status" && (pending.dataService || pending.smsService))
  const purgeConfirmValid = pending?.kind !== "purge" || pending.confirmText === subscription.iccid
  const actionDefs = actionDefinitions({
    canPurge,
    providerColor: src.color,
    providerName: src.name,
    purgeBody: purgeBodyFor(subscription.provider),
  })

  if (!isAdmin) {
    return (
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-divider px-4 py-[13px] text-[13px] font-extrabold text-title">Acciones</div>
        <div className="p-4">
          <div role="note" className="rounded-md border border-warning-action bg-warning-soft px-3 py-2.5 text-sm font-bold text-warning-icon-soft">
            Solo un administrador puede ejecutar cambios de estado o purgas.
          </div>
        </div>
      </section>
    )
  }

  function handleClick(key: ActionKey) {
    if (key === "purge") {
      setPending({ kind: "purge", confirmText: "", idempotencyKey: newIdempotencyKey() })
    } else {
      setAwaitingSync(true)
      startRefreshTransition(() => router.refresh())
    }
  }

  function beginStatusChange() {
    if (!canChangeStatus || !effectiveTarget) return
    setPending({
      kind: "status",
      target: effectiveTarget,
      dataService: subscription.normalized.services.data_service ?? true,
      smsService: subscription.normalized.services.sms_service ?? true,
      idempotencyKey: newIdempotencyKey(),
    })
  }

  async function submitAction() {
    if (!pending || busy || !servicesValid || !purgeConfirmValid) return
    setBusy(true)
    try {
      if (pending.kind === "status") {
        await setSimStatus(
          subscription.iccid,
          {
            target: pending.target,
            data_service: isMoabitsServiceTarget ? pending.dataService : undefined,
            sms_service: isMoabitsServiceTarget ? pending.smsService : undefined,
          },
          pending.idempotencyKey,
        )
        toast.success(`Estado enviado: ${pending.target}.`)
        setPending(null)
        router.refresh()
      } else {
        console.warn("[MOCK] Purga simulada. No se envio ninguna solicitud al backend.", {
          iccid: subscription.iccid,
          provider: subscription.provider,
          endpoint: `/v1/sims/${subscription.iccid}/purge`,
          idempotencyKey: pending.idempotencyKey,
        })
        toast.warning("Mock: purga simulada. No se envio ninguna solicitud.")
        setPending(null)
      }
    } catch (err) {
      toast.error(actionErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-divider px-4 py-[13px]">
          <span className="h-3.5 w-[3px] shrink-0 rounded-sm" style={{ background: src.color }} />
          <div className="flex-1 text-[13px] font-extrabold text-title">Acciones disponibles</div>
          <span className="text-[11px] text-muted">
            estado: <strong className="font-mono text-title">{currentStatus.value}</strong>
          </span>
        </div>
        <div className="flex flex-col gap-2.5 p-4">
          {canChangeStatus ? (
            <StatusChangeRow
              sourceColor={src.color}
              sourceName={src.name}
              targets={targets}
              effectiveTarget={effectiveTarget}
              onTargetChange={setSelectedTarget}
              onBegin={beginStatusChange}
            />
          ) : statusCapability?.status && statusCapability.status !== "supported" ? (
            <div role="note" className="rounded-md border border-warning-action/40 bg-warning-soft px-3 py-2.5 text-[12.5px] font-bold text-warning-icon-soft">
              Cambio de estado no disponible: {statusCapability.reason ?? statusCapability.status}.
            </div>
          ) : null}
          {actionDefs.length === 0 && !canChangeStatus && <Empty text="Sin acciones disponibles para este proveedor." />}
          {actionDefs.map((action) => (
            <ActionRow key={action.key} action={action} isRefreshing={isRefreshing} onClick={() => handleClick(action.key)} />
          ))}
        </div>
      </section>

      {pending && (
        <ConfirmationDialog
          pending={pending}
          busy={busy}
          subscription={subscription}
          sourceName={src.name}
          isMoabitsServiceTarget={isMoabitsServiceTarget}
          servicesValid={Boolean(servicesValid)}
          purgeConfirmValid={purgeConfirmValid}
          onPendingChange={setPending}
          onCancel={() => setPending(null)}
          onSubmit={submitAction}
        />
      )}
    </>
  )
}

function actionDefinitions({
  canPurge,
  providerColor,
  providerName,
  purgeBody,
}: {
  canPurge: boolean
  providerColor: string
  providerName: string
  purgeBody: string
}): ActionDef[] {
  return [
    {
      key: "sync",
      title: "Sincronizar desde fuente",
      body: `Refresca los datos consultando ${providerName} en tiempo real.`,
      color: providerColor,
      danger: false,
      icon: <Icon.refresh size={13} />,
    },
    ...(canPurge ? [{
      key: "purge" as const,
      title: "Purgar línea",
      body: purgeBody,
      color: T.danger,
      danger: true,
      icon: <Icon.close size={12} />,
    }] : []),
  ]
}

