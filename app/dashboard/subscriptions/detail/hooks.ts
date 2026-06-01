"use client"

import { getLocation, getPresence, getSmsHistory, getStatusHistory, getUsage } from "@/lib/api/sims"
import type { LocationOut, PresenceOut, UsageOut } from "@/lib/types/api"
import { useCallback, useEffect, useState } from "react"
import { errorMessage, type AsyncState } from "./utils"

export function useUsage(iccid: string, qs?: string): AsyncState<UsageOut> {
  const key = `${iccid}:${qs ?? ""}`
  const loader = useCallback(() => getUsage(iccid, qs), [iccid, qs])
  const { state } = useAsyncResource(key, loader)
  return state
}

export function usePresence(iccid: string): AsyncState<PresenceOut> {
  const loader = useCallback(() => getPresence(iccid), [iccid])
  const { state } = useAsyncResource(iccid, loader)
  return state
}

export function useSimLocation(iccid: string): AsyncState<LocationOut> {
  const loader = useCallback(() => getLocation(iccid), [iccid])
  const { state } = useAsyncResource(iccid, loader)
  return state
}

export function useSmsHistory(iccid: string) {
  const loader = useCallback(() => getSmsHistory(iccid), [iccid])
  return useAsyncResource(iccid, loader)
}

export function useStatusHistory(iccid: string) {
  const loader = useCallback(() => getStatusHistory(iccid), [iccid])
  return useAsyncResource(iccid, loader)
}

function useAsyncResource<T>(key: string, loader: () => Promise<T>) {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<{ key: string; value: AsyncState<T> }>({
    key,
    value: { status: "loading" },
  })

  useEffect(() => {
    let alive = true
    loader().then(
      (data) => {
        if (alive) setState({ key, value: { status: "success", data } })
      },
      (err) => {
        const e = errorMessage(err)
        if (alive) setState({ key, value: { status: "error", ...e } })
      },
    )
    return () => {
      alive = false
    }
  }, [key, loader, reloadToken])

  const reload = useCallback(() => {
    setState({ key, value: { status: "loading" } })
    setReloadToken((current) => current + 1)
  }, [key])

  return {
    state: state.key === key ? state.value : { status: "loading" } as AsyncState<T>,
    reload,
  }
}
