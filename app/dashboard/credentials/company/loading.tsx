export default function CredentialsCompanyLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="rounded-lg bg-[#F5FAFA] p-6">
          <div className="h-8 w-48 rounded bg-zebra" />
        </div>
        <div className="grid gap-6 min-[480px]:grid-cols-[200px_minmax(0,1fr)]">
          <div className="rounded-lg bg-white border border-border p-6 space-y-3">
            <div className="h-6 w-32 rounded bg-zebra" />
            <div className="space-y-2">
              <div className="h-10 rounded bg-zebra" />
              <div className="h-24 rounded bg-zebra" />
            </div>
          </div>
          <div className="rounded-lg bg-white border border-border p-6">
            <div className="h-96 rounded bg-zebra" />
          </div>
        </div>
      </div>
    </div>
  )
}
