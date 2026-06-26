import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const inputProps = "value" in props ? { ...props, value: props.value ?? "" } : props

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-base text-text ring-offset-page placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...inputProps}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
