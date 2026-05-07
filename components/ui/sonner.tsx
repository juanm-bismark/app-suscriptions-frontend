"use client"

import { Toaster as SonnerToaster, toast } from "sonner"

function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "border-border bg-card text-title",
          description: "text-muted",
        },
      }}
    />
  )
}

export { Toaster, toast }
