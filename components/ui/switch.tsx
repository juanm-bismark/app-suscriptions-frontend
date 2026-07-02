"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & {
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, onChange, onCheckedChange, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-slate-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-header-bg",
      className
    )}
    onCheckedChange={(checked) => {
      onCheckedChange?.(checked)
      onChange?.({ target: { checked } } as React.ChangeEvent<HTMLInputElement>)
    }}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
