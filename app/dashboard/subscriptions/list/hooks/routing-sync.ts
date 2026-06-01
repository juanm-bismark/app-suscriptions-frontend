"use client"

import { loadJob, triggerRoutingSync } from "@/app/actions/subscriptions"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import type { SourceId } from "../../tokens"
import { JOB_POLL_MS } from "./constants"

export function useRoutingSyncJob({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient()
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const triggerSyncMutation = useMutation({
    mutationFn: async (provider: SourceId) => triggerRoutingSync(provider),
    onSuccess: (result) => {
      if (result.ok) setActiveJobId(result.data.job_id)
    },
  })
  const activeJobQuery = useQuery({
    queryKey: ["job", activeJobId] as const,
    queryFn: async () => {
      if (!activeJobId) throw new Error("No job id")
      const result = await loadJob(activeJobId)
      if (!result.ok) throw new Error(result.error.detail || result.error.title || "No se pudo consultar el job")
      return result.data
    },
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === "done" || status === "failed" ? false : JOB_POLL_MS
    },
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    const job = activeJobQuery.data
    if (!job || (job.status !== "done" && job.status !== "failed")) return
    if (job.status === "done") {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      queryClient.invalidateQueries({ queryKey: ["sim-details"] })
    }
  }, [activeJobQuery.data, queryClient])

  function triggerProviderSync(provider: SourceId) {
    if (!isAdmin) return
    triggerSyncMutation.mutate(provider)
  }

  return {
    activeJobQuery,
    triggerProviderSync,
    triggerSyncMutation,
  }
}
