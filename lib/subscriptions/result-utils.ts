import type { FailedProvider } from "./types"

export function dedupeFailedProviders(failedProviders: FailedProvider[]): FailedProvider[] {
  return Array.from(
    failedProviders
      .reduce((byKey, failed) => {
        const key = `${failed.provider}:${failed.code}:${failed.title}`
        if (!byKey.has(key)) byKey.set(key, failed)
        return byKey
      }, new Map<string, FailedProvider>())
      .values()
  )
}
