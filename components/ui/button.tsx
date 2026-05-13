import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-page transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-header-bg text-header-text hover:bg-header-top",
        destructive:
          "bg-warn-bg text-warn-text hover:bg-warn-bg/90 border border-warn-border",
        outline:
          "border border-header-bg/40 bg-card text-header-bg hover:bg-header-bg",
        brandOutline:
          "border-2 border-header-client/90 bg-transparent text-header-text hover:bg-header-client hover:text-header-bg",
        secondary:
          "bg-badge-bg text-badge-text hover:bg-badge-bg/80",
        ghost: "text-header-bg hover:bg-badge-bg/70 hover:text-header-top",
        nav: "text-header-text hover:text-header-client hover:bg-header-info-bg/40",
        link: "text-header-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isIconOnly = size === "icon"
    const content = loading && loadingText ? loadingText : children

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-busy={loading || undefined}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <Loader2
            className={cn("h-4 w-4 animate-spin", !isIconOnly && "mr-2")}
            aria-hidden="true"
          />
        )}
        {isIconOnly && loading ? null : content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
