"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectItem } from "@/components/ui/select"
import { PendingLinkButton } from "../_components/pending-link-button"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

type CompanyPaginationControlsProps = {
  page: number
  pages: number | null
  size: number
  total: number | null
  query: string
  companyId?: string | null
}

export function CompanyPaginationControls({
  page,
  pages,
  size,
  total,
  query,
  companyId,
}: CompanyPaginationControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const hasPrevious = page > 1
  const hasNext = pages !== null ? page < pages : total === null ? false : page * size < total

  function pageHref(nextPage: number, nextSize = size) {
    const params = new URLSearchParams({
      page: String(Math.max(nextPage, 1)),
      size: String(nextSize),
    })
    if (query) params.set("q", query)
    if (companyId) params.set("companyId", companyId)

    return `/dashboard/credentials?${params.toString()}`
  }

  return (
    <div className="mt-5 space-y-3 border-t border-[#D8E7EA] pt-4 text-sm text-muted">
      <div className="grid grid-cols-2 gap-2">
        <PendingLinkButton
          href={pageHref(page - 1)}
          disabled={!hasPrevious}
          loadingText="Cargando..."
          className={`rounded-md px-2 py-2 text-center text-xs font-semibold transition-colors ${hasPrevious ? "border border-[#94A3B8]/50 bg-[#E8EEF2] text-[#334155] shadow-sm shadow-header-top/5 hover:border-[#334155] hover:bg-[#334155] hover:text-white" : "pointer-events-none border border-[#CBD5E1]/60 bg-[#EEF3F5] text-[#64748B]/60"}`}
        >
          Anterior
        </PendingLinkButton>
        <PendingLinkButton
          href={pageHref(page + 1)}
          disabled={!hasNext}
          loadingText="Cargando..."
          className={`rounded-md px-2 py-2 text-center text-xs font-semibold transition-colors ${hasNext ? "border border-[#0E7490]/30 bg-[#D8F0F2] text-[#155E75] shadow-sm shadow-[#0891B2]/10 hover:border-[#155E75] hover:bg-[#155E75] hover:text-white" : "pointer-events-none border border-[#B8DDE1]/70 bg-[#E3F1F2] text-[#326472]/55"}`}
        >
          Siguiente
        </PendingLinkButton>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
        <span>
          Página {page}{pages ? ` de ${pages}` : ""}{total !== null ? ` · ${total} empresas` : ""}
        </span>
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
            className="h-9 w-20 border-[#C9DFE3] bg-white"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}
