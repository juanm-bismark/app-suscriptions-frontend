"use client"

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
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[70] grid place-items-center p-4 bg-[rgba(15,23,42,0.42)]"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-[min(460px,100%)] bg-card rounded-lg border border-border/45 overflow-hidden shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
      >
        <div className="px-[18px] py-4 border-b border-divider">
          <h3 className="m-0 text-title text-base">Purgar SIM</h3>
          <p className="mt-1.5 mb-0 text-muted text-[13px]">
            Mockup para <span className="font-mono">{record.iccid}</span>
          </p>
        </div>
        <div className="p-[18px] text-text text-sm leading-snug">
          Esta accion solo simula el flujo de purga para {src.name}. No se llamara al endpoint del backend.
        </div>
        <div className="px-3.5 py-3.5 border-t border-divider flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-border/45 bg-card text-text rounded-md px-2.5 py-2 cursor-pointer text-xs font-extrabold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md px-2.5 py-2 cursor-pointer text-xs font-extrabold border bg-[#FADDD6] text-[#A84234] border-[#C85A4A]"
          >
            Simular purga
          </button>
        </div>
      </div>
    </div>
  )
}

