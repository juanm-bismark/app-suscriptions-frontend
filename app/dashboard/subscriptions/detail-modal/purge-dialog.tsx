"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui"
import type { SubscriptionRow } from "@/lib/api/sim-mapper"
import { SOURCES } from "../tokens"

export function PurgeMockDialog({
  record,
  onClose,
  onConfirm,
}: {
  record: SubscriptionRow
  onClose: () => void
  onConfirm: () => void
}) {
  const src = SOURCES[record.provider]

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialogContent className="w-[min(92vw,460px)] gap-0 overflow-hidden p-0">
        <AlertDialogHeader className="border-b border-divider px-[18px] py-4">
          <AlertDialogTitle className="text-base">Purgar SIM</AlertDialogTitle>
          <AlertDialogDescription>
            Mockup para <span className="font-mono">{record.iccid}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="p-[18px] text-sm leading-snug text-text">
          Esta accion solo simula el flujo de purga para {src.name}. No se llamara al endpoint del backend.
        </div>
        <AlertDialogFooter className="border-t border-divider px-3.5 py-3.5">
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="border-danger-action bg-danger-action text-white hover:bg-danger-action-hover"
          >
            Simular purga
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
