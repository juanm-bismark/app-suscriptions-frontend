"use client"

import { Dialog, DialogContent, DialogDescription, DialogTitle, toast } from "@/components/ui"
import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DetailModalFooter } from "./detail-modal/footer"
import { DetailModalHeader } from "./detail-modal/header"
import { IdentifierRow } from "./detail-modal/identifier-row"
import { PlanBanner } from "./detail-modal/plan-banner"
import { PurgeMockDialog } from "./detail-modal/purge-dialog"
import { detailHref, IDENTIFIER_COLORS, value } from "./detail-modal/utils"
import type { SourceId } from "./tokens"

export interface DetailModalProps {
  record: SubscriptionRow | null
  selectedProvider?: SourceId
  onClose: () => void
}

export function DetailModal({ record, selectedProvider, onClose }: DetailModalProps) {
  const router = useRouter()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [purgeMockOpen, setPurgeMockOpen] = useState(false)
  if (!record) return null
  const activeRecord = record

  async function copyToClipboard(text: string, fieldKey: string, label: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const input = document.createElement("textarea")
        input.value = text
        input.style.position = "fixed"
        input.style.left = "-9999px"
        document.body.appendChild(input)
        input.focus()
        input.select()
        document.execCommand("copy")
        input.remove()
      }
      setCopiedField(fieldKey)
      toast.success(`${label} copiado`)
      window.setTimeout(() => setCopiedField((current) => (current === fieldKey ? null : current)), 1600)
    } catch {
      toast.error(`No pudimos copiar el ${label}`)
    }
  }

  function simulatePurge() {
    console.warn("[MOCK] Purga simulada. No se envio ninguna solicitud al backend.", {
      iccid: activeRecord.iccid,
      provider: activeRecord.provider,
      endpoint: `/v1/sims/${activeRecord.iccid}/purge`,
    })
    toast.warning("Mock: purga simulada. No se envio ninguna solicitud.")
    setPurgeMockOpen(false)
  }

  function openDetail(row: SubscriptionRow, tab?: "actions") {
    onClose()
    router.push(detailHref(row, selectedProvider, tab))
  }

  return (
    <Dialog open={Boolean(record)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-[680px] flex-col gap-0 overflow-hidden rounded-lg border-border/45 bg-card p-0 font-body shadow-[0_20px_60px_rgba(15,32,42,0.25),0_2px_8px_rgba(15,32,42,0.1)]"
      >
        <DialogTitle className="sr-only">
          Detalle de suscripción {activeRecord.iccid}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Identificadores y acciones rápidas de la suscripción seleccionada.
        </DialogDescription>
        <DetailModalHeader record={activeRecord} onClose={onClose} />
        <div className="flex-1 overflow-auto">
          <PlanBanner record={activeRecord} />
          <div className="px-[22px] pt-3 pb-1.5 text-[10.5px] tracking-wider text-muted font-bold uppercase">
            Identificadores
          </div>
          <IdentifierRow
            label="ICCID"
            description="Chip físico de la SIM (18-22 dígitos)"
            value={activeRecord.iccid}
            color={IDENTIFIER_COLORS.iccid}
            onCopy={() => copyToClipboard(activeRecord.iccid, "iccid", "ICCID")}
            isCopied={copiedField === "iccid"}
          />
          <IdentifierRow
            label="MSISDN"
            description="Número de línea telefónica"
            value={value(activeRecord.msisdn)}
            color={IDENTIFIER_COLORS.msisdn}
            isMissing={!activeRecord.msisdn?.trim()}
            onCopy={activeRecord.msisdn ? () => copyToClipboard(activeRecord.msisdn!, "msisdn", "MSISDN") : undefined}
            isCopied={copiedField === "msisdn"}
          />
          <IdentifierRow
            label="IMSI"
            description="Identidad del abonado en la red móvil"
            value={value(activeRecord.imsi)}
            color={IDENTIFIER_COLORS.imsi}
            isMissing={!activeRecord.imsi?.trim()}
            onCopy={activeRecord.imsi ? () => copyToClipboard(activeRecord.imsi!, "imsi", "IMSI") : undefined}
            isCopied={copiedField === "imsi"}
          />
        </div>
        <DetailModalFooter
          record={activeRecord}
          onActions={(row) => openDetail(row, "actions")}
          onOpenDetail={(row) => openDetail(row)}
          onOpenPurge={() => setPurgeMockOpen(true)}
        />
      </DialogContent>

      {purgeMockOpen && (
        <PurgeMockDialog
          record={activeRecord}
          onClose={() => setPurgeMockOpen(false)}
          onConfirm={simulatePurge}
        />
      )}
    </Dialog>
  )
}
