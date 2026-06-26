"use client"

import { useState, useTransition } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

interface ProblemLike {
  title?: string | null
  detail?: string | null
  instance?: string | null
  code?: string | null
  status?: number | null
  message?: string | null
  digest?: string
}

interface ProblemAlertProps {
  problem?: ProblemLike | null
  title?: string
  fallbackDetail?: string
  onRetry?: () => void
  children?: ReactNode
}

export function ProblemAlert({
  problem,
  title = "Error",
  fallbackDetail = "Ocurrio un problema. Por favor, intenta de nuevo.",
  onRetry,
  children,
}: ProblemAlertProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isRetrying, startRetry] = useTransition()
  const requestId = problem?.instance || problem?.digest || null
  const displayTitle = problem?.title || title
  const detail = problem?.detail || problem?.message || fallbackDetail

  async function copyRequestId() {
    if (!requestId) return
    await navigator.clipboard.writeText(requestId)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function retry() {
    onRetry?.()
    router.refresh()
  }

  return (
    <div role="alert" className="rounded-lg border border-danger-action/20 bg-danger-tint p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-danger-action">
            {problem?.status ? `HTTP ${problem.status}` : problem?.code || "Error"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-danger-strong-text">{displayTitle}</h2>
          <p className="mt-2 text-sm text-danger-text-soft">{detail}</p>
          {requestId && (
            <p className="mt-3 break-all font-mono text-xs text-danger-text-soft">
              Request id: {requestId}
            </p>
          )}
        </div>
        {requestId && (
          <Button type="button" variant="outline" size="sm" onClick={copyRequestId}>
            {copied ? "Copiado" : "Copiar request id"}
          </Button>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
      {onRetry && (
        <Button
          type="button"
          className="mt-4"
          loading={isRetrying}
          loadingText="Cargando..."
          onClick={() => startRetry(retry)}
        >
          Intentar de nuevo
        </Button>
      )}
    </div>
  )
}
