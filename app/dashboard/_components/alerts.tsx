import React from "react"

interface AlertProps {
  children: React.ReactNode
  className?: string
}

export function WarningAlert({ children, className = "" }: AlertProps) {
  return (
    <div
      className={`rounded-lg bg-warning-soft p-4 text-sm text-warning-text-soft shadow-sm shadow-warn-bg/5 ${className}`}
    >
      {children}
    </div>
  )
}

export function ErrorAlert({ children, className = "" }: AlertProps) {
  return (
    <div
      className={`rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 shadow-sm shadow-red-200/5 ${className}`}
    >
      {children}
    </div>
  )
}

export function SuccessAlert({ children, className = "" }: AlertProps) {
  return (
    <div
      className={`rounded-lg bg-success-soft p-4 text-sm text-success-text-soft shadow-sm shadow-success-bg/5 ${className}`}
    >
      {children}
    </div>
  )
}
