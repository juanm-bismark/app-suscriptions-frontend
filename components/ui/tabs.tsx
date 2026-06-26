"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string
  baseId: string
  setValue: (value: string) => void
} | null>(null)

function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const reactId = React.useId()
  const current = value ?? internalValue
  const baseId = `tabs-${reactId.replace(/:/g, "")}`

  const setValue = React.useCallback(
    (next: string) => {
      setInternalValue(next)
      onValueChange?.(next)
    },
    [onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: current, baseId, setValue }}>
      <div className={cn("grid gap-4", className)} {...props} />
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex h-10 items-center rounded-md bg-page p-1 text-muted", className)}
      {...props}
    />
  )
}

function TabsTrigger({
  value,
  className,
  onClick,
  onKeyDown,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx?.value === value
  const triggerId = ctx ? `${ctx.baseId}-trigger-${value}` : undefined
  const contentId = ctx ? `${ctx.baseId}-content-${value}` : undefined

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    const navigationKeys = ["ArrowLeft", "ArrowRight", "Home", "End"]
    if (!navigationKeys.includes(event.key)) return

    const list = event.currentTarget.closest('[role="tablist"]')
    const triggers = Array.from(
      list?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? []
    )
    const currentIndex = triggers.indexOf(event.currentTarget)
    if (currentIndex === -1) return

    event.preventDefault()
    const lastIndex = triggers.length - 1
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? lastIndex
          : event.key === "ArrowLeft"
            ? (currentIndex - 1 + triggers.length) % triggers.length
            : (currentIndex + 1) % triggers.length
    triggers[nextIndex]?.focus()
    triggers[nextIndex]?.click()
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={contentId}
      id={triggerId}
      tabIndex={active ? 0 : -1}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-header-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active ? "bg-card text-title shadow-sm" : "text-muted hover:text-title",
        className
      )}
      {...props}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) ctx?.setValue(value)
      }}
    />
  )
}

function TabsContent({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-content-${value}`}
      aria-labelledby={`${ctx.baseId}-trigger-${value}`}
      tabIndex={0}
      className={cn("mt-2", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
