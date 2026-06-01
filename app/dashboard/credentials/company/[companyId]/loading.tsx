export default function CompanyCredentialsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="rounded-lg bg-panel-soft p-6">
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-zebra" />
            <div className="h-4 w-48 rounded bg-zebra" />
          </div>
        </div>
        <div className="rounded-lg bg-white border border-border p-6">
          <div className="h-96 rounded bg-zebra" />
        </div>
      </div>
    </div>
  )
}
