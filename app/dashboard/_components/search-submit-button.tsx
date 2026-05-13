"use client"

import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"
import { cn } from "@/lib/utils"

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
        "inline-flex items-center justify-center rounded-md bg-[#0F202A] px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-header-top/20 transition-colors hover:bg-[#163C41] disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? loadingText : children}
    </button>
  )
}
