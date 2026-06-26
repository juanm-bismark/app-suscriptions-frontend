import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-badge-bg text-badge-text",
        secondary: "border-transparent bg-panel-soft text-muted",
        destructive: "border-danger-action/20 bg-danger-tint text-danger-strong-text",
        outline: "border-border bg-card text-title",
        success: "border-success-bg/20 bg-success-soft text-success-text-soft",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
