"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SignInButton() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-muted">No tienes cuenta?</p>
      <Button asChild className="w-full bg-[#12343B] font-semibold text-white shadow-md shadow-header-top/15 hover:bg-[#1A4A52] hover:text-white">
        <Link href="/register">Crear cuenta</Link>
      </Button>
    </div>
  )
}
