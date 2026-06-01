"use client"

import type { Provider } from "@/lib/types/api"
import { SimImportHeader } from "./import-header"
import { SimImportReviewCard } from "./import-review-card"
import { SimImportUploadCard } from "./import-upload-card"
import { useSimImport } from "./use-sim-import"

export function SimImportForm({ activeProviders }: { activeProviders: Provider[] }) {
  const simImport = useSimImport(activeProviders)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <SimImportHeader />
      <form onSubmit={simImport.onSubmit} className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <SimImportUploadCard
          activeProvidersCount={activeProviders.length}
          error={simImport.error}
          exampleCsv={simImport.exampleCsv}
          fileName={simImport.fileName}
          onFileSelected={simImport.onFileSelected}
          parsed={simImport.parsed}
          ready={simImport.ready}
          submitting={simImport.submitting}
          success={simImport.success}
        />
        <SimImportReviewCard activeProviders={activeProviders} providerCounts={simImport.providerCounts} />
      </form>
    </main>
  )
}

