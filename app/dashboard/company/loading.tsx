export default function CompanyLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-8 rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex animate-pulse flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-9 w-40 rounded bg-zebra" />
            <div className="h-5 w-96 max-w-full rounded bg-zebra" />
          </div>
          <div className="flex max-w-full items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5 sm:w-56">
            <div className="h-9 w-9 shrink-0 rounded-md bg-[#DDF1F2]" />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 h-3 w-16 rounded bg-zebra" />
              <div className="h-4 w-24 rounded bg-zebra" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)]">
        <section className="rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="animate-pulse">
              <div className="mb-2 h-7 w-40 rounded bg-[#DDECEE]" />
              <div className="h-4 w-48 rounded bg-[#E5F0F1]" />
            </div>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C8E8EA] border-t-[#326472]" />
          </div>

          <div className="flex h-11 items-center gap-2 rounded-md border border-[#C9DFE3] bg-white px-3 shadow-sm shadow-header-top/5">
            <div className="h-4 w-4 rounded bg-[#D8E7EA]" />
            <div className="h-4 w-44 rounded bg-zebra" />
          </div>

          <div className="mt-3 max-h-[420px] space-y-2 overflow-hidden rounded-lg border border-[#D8E7EA] bg-white p-2 shadow-sm shadow-header-top/5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-3 rounded-md px-3 py-3">
                <div className="h-9 w-9 shrink-0 rounded-md bg-[#DDF1F2]" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-3/5 rounded bg-zebra" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-4 w-44 animate-pulse rounded bg-[#DDECEE]" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="h-9 w-24 animate-pulse rounded-md bg-white" />
              <div className="flex gap-2">
                <div className="h-10 w-20 animate-pulse rounded-md bg-[#E8EEF2]" />
                <div className="h-10 w-24 animate-pulse rounded-md bg-[#D8F0F2]" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-[#DDF1F2] p-5 shadow-sm shadow-header-top/5 sm:p-6">
          <div className="h-7 w-36 animate-pulse rounded bg-[#C8E8EA]" />
          <div className="mt-5 rounded-lg bg-white/65 p-6 shadow-sm shadow-header-top/5">
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#D8E7EA]" />
          </div>
        </section>
      </div>
    </div>
  )
}
