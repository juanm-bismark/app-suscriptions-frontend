export default function UsersLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      <div className="mb-8 rounded-lg bg-panel-soft p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="h-9 bg-zebra rounded w-40 mb-2" />
            <div className="h-5 bg-zebra rounded w-96 max-w-full" />
          </div>
          <div className="flex max-w-full items-center gap-3 rounded-md border border-soft-border bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:w-56">
            <div className="h-9 w-9 shrink-0 rounded-md bg-accent-soft" />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 h-3 w-14 rounded bg-zebra" />
              <div className="h-4 w-32 rounded bg-zebra" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-panel-soft rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
          <div className="h-6 bg-zebra rounded w-40 mb-4" />
          <div className="overflow-hidden rounded-lg">
            <div className="grid grid-cols-[1.2fr_.7fr_auto] bg-hover-soft px-6 py-3 gap-4">
              <div className="h-3 bg-[#D4E8EA] rounded w-20" />
              <div className="h-3 bg-[#D4E8EA] rounded w-16" />
              <div className="ml-auto h-3 bg-[#D4E8EA] rounded w-20" />
            </div>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="grid grid-cols-[1.2fr_.7fr_auto] items-center gap-4 px-6 py-4">
                <div className="h-4 bg-zebra rounded w-36 max-w-full" />
                <div className="h-6 bg-success-soft rounded-full w-20" />
                <div className="h-9 w-9 rounded-md bg-[#ECFEFF]" />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-4 w-44 rounded bg-zebra" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="h-9 w-24 rounded-md bg-white" />
              <div className="flex gap-2">
                <div className="h-10 w-20 rounded-md bg-previous-soft" />
                <div className="h-10 w-24 rounded-md bg-next-soft" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-soft rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
          <div className="h-6 bg-[#C8E8EA] rounded w-36 mb-5" />
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item}>
                <div className="h-4 bg-[#C8E8EA] rounded w-28 mb-2" />
                <div className="h-10 bg-white/80 rounded-md shadow-sm shadow-header-top/5" />
              </div>
            ))}
            <div>
              <div className="h-4 bg-[#C8E8EA] rounded w-24 mb-2" />
              <div className="h-10 bg-white/80 rounded-md shadow-sm shadow-header-top/5" />
            </div>
            <div className="h-10 bg-header-top rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
