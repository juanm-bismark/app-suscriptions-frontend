"use client"

import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"
import { cn } from "@/lib/utils"
import { dashboardStyles } from "./dashboard-styles"

type SearchSubmitButtonProps = {
  children?: React.ReactNode
  className?: string
  loadingText?: React.ReactNode
}

export function SearchSubmitButton({
  children = "Buscar",
  className,
  loadingText = "Buscando...",
}: SearchSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cn(
        dashboardStyles.primaryAction,
        className,
      )}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? loadingText : children}
    </button>
  )
}
