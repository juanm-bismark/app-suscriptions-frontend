"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { dropPaginationParams, PAGE_SIZE_OPTIONS, setParam } from "./url"

export function SubscriptionsPaginationControls({
  page,
  size,
  rowsShown,
  total,
  partial,
  partialLabel,
  nextCursor,
  currentCursor,
  cursorStack,
  pathname,
  searchParams,
}: {
  page: number
  size: number
  rowsShown: number
  total: number | null
  partial: boolean
  partialLabel: string
  nextCursor: string | null
  currentCursor: string
  cursorStack: string[]
  pathname: string
  searchParams: ReturnType<typeof useSearchParams>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const hasPrevious = page > 1 && (cursorStack.length > 0 || Boolean(currentCursor))
  const hasNext = Boolean(nextCursor)

  function hrefFor(nextParams: URLSearchParams) {
    const next = nextParams.toString()
    return `${pathname}${next ? `?${next}` : ""}`
  }

  function nextHref() {
    const params = new URLSearchParams(searchParams)
    if (!nextCursor) return hrefFor(params)
    params.set("cursor", nextCursor)
    params.set("cursor_stack", JSON.stringify([...cursorStack, currentCursor || ""]))
    params.set("page", String(page + 1))
    return hrefFor(params)
  }

  function previousHref() {
    const params = new URLSearchParams(searchParams)
    const previousCursor = cursorStack[cursorStack.length - 1] ?? ""
    const nextStack = cursorStack.slice(0, -1)
    setParam(params, "cursor", previousCursor || null)
    setParam(params, "cursor_stack", nextStack.length ? JSON.stringify(nextStack) : null)
    const previousPage = Math.max(1, page - 1)
    setParam(params, "page", previousPage > 1 ? String(previousPage) : null)
    return hrefFor(params)
  }

  function sizeHref(nextSize: number) {
    const params = new URLSearchParams(searchParams)
    params.set("size", String(nextSize))
    dropPaginationParams(params)
    return hrefFor(params)
  }

  function go(href: string) {
    startTransition(() => router.push(href))
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3.5 text-xs text-muted">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-mono">
          Página {page} · {rowsShown} SIM{rowsShown !== 1 ? "s" : ""}
        </span>
        {total !== null && <span className="font-mono">{total} en esta consulta</span>}
        {partial && <span>{partialLabel}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-[7px] whitespace-nowrap font-semibold">
          Mostrar
          <select
            value={size}
            disabled={isPending}
            onChange={(event) => go(sizeHref(Number(event.target.value)))}
            className="h-8 rounded-[5px] border border-border bg-card px-2 font-bold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!hasPrevious || isPending}
          onClick={() => go(previousHref())}
          className={cn(
            "rounded-[5px] border border-transparent px-2.5 py-[7px] text-xs font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
            hasPrevious
              ? "cursor-pointer bg-previous-soft text-slate-strong hover:bg-disabled-soft"
              : "cursor-not-allowed bg-disabled-soft text-slate-muted/60"
          )}
        >
          {isPending && hasPrevious ? "Cargando..." : "Anterior"}
        </button>
        <button
          type="button"
          disabled={!hasNext || isPending}
          onClick={() => go(nextHref())}
          className={cn(
            "rounded-[5px] border border-transparent px-2.5 py-[7px] text-xs font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent",
            hasNext
              ? "cursor-pointer bg-next-soft text-action-teal hover:bg-action-teal-soft"
              : "cursor-not-allowed bg-skeleton-muted text-table-header-text/55"
          )}
        >
          {isPending && hasNext ? "Cargando..." : "Siguiente"}
        </button>
      </div>
    </div>
  )
}
