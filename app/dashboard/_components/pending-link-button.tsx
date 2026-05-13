"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PendingLinkButtonProps = {
  href: string
  children: ReactNode
  className?: string
  disabled?: boolean
  loadingText?: ReactNode
}

export function PendingLinkButton({
  href,
  children,
  className,
  disabled = false,
  loadingText = "Cargando...",
}: PendingLinkButtonProps) {
  const [pending, setPending] = useState(false)
  const isDisabled = disabled || pending

  return (
    <Link
      href={isDisabled ? "#" : href}
      aria-disabled={isDisabled}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault()
          return
        }

        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        setPending(true)
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors",
        isDisabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? loadingText : children}
    </Link>
  )
}
