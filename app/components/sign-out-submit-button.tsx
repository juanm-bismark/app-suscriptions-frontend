"use client"

import { useFormStatus } from "react-dom"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SignOutSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      variant="default"
      type="submit"
      loading={pending}
      loadingText="Saliendo..."
      className="h-9 gap-2 border-0 bg-[#12343B] px-3 text-white shadow-sm shadow-header-top/15 hover:bg-[#0F202A] hover:text-white"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>Salir</span>
    </Button>
  )
}
