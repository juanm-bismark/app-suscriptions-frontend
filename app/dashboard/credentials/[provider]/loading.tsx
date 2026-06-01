export default function ProviderCredentialLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

      {/* Header */}
      <div className="mb-5 animate-pulse">
        <div className="h-4 w-32 rounded bg-zebra" />
        <div className="mt-2 h-9 w-48 rounded bg-zebra" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-zebra" />
      </div>

      {/* Form card */}
      <div className="rounded-lg bg-accent-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <FormSkeleton />
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-lg bg-white/30 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-24 rounded bg-zebra" />
              <div className="h-10 rounded-md bg-white/80" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 border-t border-header-top/10 pt-3">
        <div className="h-10 w-36 rounded-md bg-white/80" />
        <div className="h-10 w-24 rounded-md bg-[#060D13]/70" />
      </div>
    </div>
  )
}
