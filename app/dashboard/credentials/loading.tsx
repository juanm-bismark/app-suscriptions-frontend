export default function CredentialsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header card */}
      <div className="mb-8 animate-pulse rounded-lg bg-[#F5FAFA] p-5 shadow-sm shadow-header-top/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-9 w-44 rounded bg-zebra" />
            <div className="h-4 w-72 max-w-full rounded bg-zebra" />
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-24 rounded-md bg-zebra" />
              <div className="h-8 w-24 rounded-md bg-[#0F202A]/20" />
            </div>
          </div>
          <div className="flex w-full max-w-xs items-center gap-3 rounded-md border border-[#C9DFE3] bg-white px-3 py-2.5 shadow-sm shadow-header-top/5">
            <div className="h-9 w-9 shrink-0 rounded-md bg-[#DDF1F2]" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-20 rounded bg-zebra" />
              <div className="h-4 w-28 rounded bg-zebra" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin layout: sidebar + table */}
      <div className="grid gap-6 min-[480px]:grid-cols-[200px_minmax(0,1fr)] sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">

        {/* Company sidebar */}
        <div className="animate-pulse rounded-lg bg-[#F5FAFA] p-4 shadow-sm shadow-header-top/5 sm:p-5">
          <div className="mb-4 h-6 w-24 rounded bg-zebra" />
          <div className="mb-2 h-9 rounded-md border border-[#C9DFE3] bg-white" />
          <div className="mb-4 h-8 rounded-md bg-[#0F202A]/80" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-md bg-white/75 px-3 py-3 shadow-sm shadow-header-top/5">
                <div className="h-4 w-4/5 rounded bg-zebra" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#D8E7EA] pt-4">
            <div className="h-8 rounded-md bg-[#E8EEF2]" />
            <div className="h-8 rounded-md bg-[#D8F0F2]" />
          </div>
        </div>

        {/* Credentials table */}
        <div className="overflow-hidden rounded-lg bg-[#F5FAFA] shadow-sm shadow-header-top/5">
          <div className="animate-pulse border-b border-[#D8E7EA] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="h-6 w-48 rounded bg-zebra" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-36 rounded-md bg-white shadow-sm" />
                <div className="h-9 w-28 rounded-md bg-[#0F202A]/80" />
              </div>
            </div>
          </div>

          <div className="animate-pulse">
            <div className="grid grid-cols-6 gap-3 bg-[#EAF6F7] px-6 py-3">
              {["w-20", "w-14", "w-16", "w-24", "w-20", "w-16"].map((w, i) => (
                <div key={i} className={`h-3 rounded bg-[#D4E8EA] ${w}`} />
              ))}
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid h-[72px] grid-cols-6 items-center gap-3 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-[#DDF1F2]" />
                  <div className="h-4 w-14 rounded bg-zebra" />
                </div>
                <div className="h-6 w-16 rounded-full bg-[#DDF4EA]" />
                <div className="h-6 w-16 rounded-full bg-[#F1F5F9]" />
                <div className="h-4 w-20 rounded bg-zebra" />
                <div className="h-4 w-20 rounded bg-zebra" />
                <div className="flex justify-end gap-2">
                  <div className="h-9 w-16 rounded-md bg-[#EAF6F7]" />
                  <div className="h-9 w-20 rounded-md bg-[#0F202A]/80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
