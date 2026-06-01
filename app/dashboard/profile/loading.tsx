export default function ProfileLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      <div className="mb-6 rounded-lg bg-panel-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-9 bg-zebra rounded w-40 mb-2" />
            <div className="h-5 bg-zebra rounded w-72 max-w-full" />
          </div>
          <div className="flex max-w-full items-center gap-3 rounded-md border border-soft-border bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:w-56">
            <div className="h-9 w-9 shrink-0 rounded-md bg-accent-soft" />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 h-3 w-16 rounded bg-zebra" />
              <div className="h-4 w-28 rounded bg-zebra" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-accent-soft rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <div key={item}>
              <div className="h-4 bg-badge-bg rounded w-28 mb-2" />
              <div className="h-11 bg-white/55 rounded-md shadow-sm shadow-header-top/5" />
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="h-4 bg-badge-bg rounded w-32 mb-2" />
            <div className="h-10 bg-white/80 rounded-md shadow-sm shadow-header-top/5" />
          </div>
          <div className="h-10 bg-header-top rounded-md w-40" />
        </div>
      </div>
    </div>
  )
}
