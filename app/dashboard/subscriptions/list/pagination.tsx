"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { T } from "../tokens"
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
    <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", fontSize: 12, color: T.muted }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: T.fontMono }}>
          Página {page} · {rowsShown} SIM{rowsShown !== 1 ? "s" : ""}
        </span>
        {total !== null && <span style={{ fontFamily: T.fontMono }}>{total} en esta consulta</span>}
        {partial && <span>{partialLabel}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontWeight: 600 }}>
          Mostrar
          <select
            value={size}
            disabled={isPending}
            onChange={(event) => go(sizeHref(Number(event.target.value)))}
            style={{ height: 32, border: `1px solid ${T.border}`, background: "#fff", color: T.text, borderRadius: 5, padding: "0 8px", fontFamily: T.fontBody, fontWeight: 700 }}
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
          style={{
            border: "1px solid transparent",
            background: hasPrevious ? "#E8EEF2" : "#EEF3F5",
            color: hasPrevious ? "#334155" : "#64748B99",
            borderRadius: 5,
            padding: "7px 10px",
            cursor: hasPrevious && !isPending ? "pointer" : "not-allowed",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: T.fontBody,
          }}
        >
          {isPending && hasPrevious ? "Cargando..." : "Anterior"}
        </button>
        <button
          type="button"
          disabled={!hasNext || isPending}
          onClick={() => go(nextHref())}
          style={{
            border: "1px solid transparent",
            background: hasNext ? "#ECFEFF" : "#E5F0F1",
            color: hasNext ? "#0E7490" : "#32647288",
            borderRadius: 5,
            padding: "7px 10px",
            cursor: hasNext && !isPending ? "pointer" : "not-allowed",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: T.fontBody,
          }}
        >
          {isPending && hasNext ? "Cargando..." : "Siguiente"}
        </button>
      </div>
    </div>
  )
}
