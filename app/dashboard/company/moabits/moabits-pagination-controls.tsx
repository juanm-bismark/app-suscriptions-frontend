"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectItem } from "@/components/ui/select"
import { buildHref } from "@/lib/url"
import { PendingLinkButton } from "../../_components/pending-link-button"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

type MoabitsPaginationControlsProps = {
  page: number
  pages: number | null
  size: number
  total: number | null
  query?: string
}

export function MoabitsPaginationControls({
  page,
  pages,
  size,
  total,
  query = "",
}: MoabitsPaginationControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const hasPrevious = page > 1
  const hasNext = pages !== null ? page < pages : false

  function pageHref(nextPage: number, nextSize = size) {
    return buildHref("/dashboard/company/moabits", {
      page: String(Math.max(nextPage, 1)),
      size: String(nextSize),
      q: query,
    })
  }

  return (
    <div className="mt-5 flex flex-col gap-3 pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>
        Página {page}{pages ? ` de ${pages}` : ""}{total !== null ? ` · ${total} vinculacion${total !== 1 ? "es" : ""}` : ""}
      </span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted">
          <span>Mostrar</span>
          <Select
            value={String(size)}
            disabled={isPending}
            onChange={(event) => {
              startTransition(() => {
                router.push(pageHref(1, Number(event.target.value)))
              })
            }}
            className="h-9 w-24 border-[#C9DFE3] bg-white"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <PendingLinkButton
            href={pageHref(page - 1)}
            disabled={!hasPrevious}
            loadingText="Cargando..."
            className={`rounded-md px-3 py-2 font-semibold transition-colors ${hasPrevious ? "border border-[#94A3B8]/50 bg-[#E8EEF2] text-[#334155] shadow-sm shadow-header-top/5 hover:border-[#334155] hover:bg-[#334155] hover:text-white" : "pointer-events-none border border-[#CBD5E1]/60 bg-[#EEF3F5] text-[#64748B]/60"}`}
          >
            Anterior
          </PendingLinkButton>
          <PendingLinkButton
            href={pageHref(page + 1)}
            disabled={!hasNext}
            loadingText="Cargando..."
            className={`rounded-md px-3 py-2 font-semibold transition-colors ${hasNext ? "border border-[#0E7490]/30 bg-[#D8F0F2] text-[#155E75] shadow-sm shadow-[#0891B2]/10 hover:border-[#155E75] hover:bg-[#155E75] hover:text-white" : "pointer-events-none border border-[#B8DDE1]/70 bg-[#E3F1F2] text-[#326472]/55"}`}
          >
            Siguiente
          </PendingLinkButton>
        </div>
      </div>
    </div>
  )
}
