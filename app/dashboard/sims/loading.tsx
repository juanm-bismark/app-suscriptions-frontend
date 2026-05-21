export default function SimsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="animate-pulse space-y-8">
        <div className="rounded-lg bg-[#F5FAFA] p-6">
          <div className="space-y-3">
            <div className="h-8 w-48 rounded bg-zebra" />
            <div className="h-4 w-96 max-w-full rounded bg-zebra" />
          </div>
        </div>
        <div className="rounded-lg bg-white border border-border p-6">
          <div className="h-64 rounded bg-zebra" />
        </div>
      </div>
    </div>
  )
}
