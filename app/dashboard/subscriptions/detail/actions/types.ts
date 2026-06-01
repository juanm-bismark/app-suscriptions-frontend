import type { ReactNode } from "react"

export type PendingAction =
  | { kind: "status"; target: string; dataService: boolean; smsService: boolean; idempotencyKey: string }
  | { kind: "purge"; confirmText: string; idempotencyKey: string }

export type ActionKey = "sync" | "purge"

export interface ActionDef {
  key: ActionKey
  title: string
  body: string
  color: string
  danger: boolean
  icon: ReactNode
}

