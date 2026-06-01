export default function SimImportLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="rounded-lg bg-accent-soft p-6">
          <div className="space-y-3">
            <div className="h-6 w-48 rounded bg-zebra" />
            <div className="h-4 w-96 max-w-full rounded bg-zebra" />
          </div>
        </div>
        <div className="rounded-lg bg-white border border-border/45 p-8">
          <div className="space-y-4">
            <div className="h-10 w-full rounded bg-zebra" />
            <div className="h-32 w-full rounded bg-zebra" />
            <div className="h-10 w-24 rounded bg-zebra" />
          </div>
        </div>
      </div>
    </div>
  )
}
