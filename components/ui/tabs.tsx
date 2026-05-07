"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string
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
  const current = value ?? internalValue

  const setValue = React.useCallback(
    (next: string) => {
      setInternalValue(next)
      onValueChange?.(next)
    },
    [onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
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
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx?.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        active ? "bg-card text-title shadow-sm" : "text-muted hover:text-title",
        className
      )}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) ctx?.setValue(value)
      }}
      {...props}
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
  return <div role="tabpanel" className={cn("mt-2", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
