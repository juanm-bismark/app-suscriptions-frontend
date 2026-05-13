export default function MoabitsCredentialsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header */}
      <div className="mb-8 animate-pulse">
        <div className="h-4 w-32 rounded bg-zebra" />
        <div className="mt-4 h-9 w-32 rounded bg-zebra" />
        <div className="mt-2 h-4 w-80 max-w-full rounded bg-zebra" />
      </div>

      <div className="grid grid-cols-1 gap-8">

        {/* Credentials form section */}
        <section className="rounded-lg bg-[#DDF1F2] p-6 shadow-sm shadow-header-top/5 sm:p-8">
          <div className="mb-4 flex animate-pulse items-center justify-between">
            <div className="h-6 w-28 rounded bg-zebra" />
            <div className="h-9 w-44 rounded-md bg-white/60" />
          </div>
          <div className="animate-pulse space-y-4">
            <div className="rounded-lg bg-white/30 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4, 5].map((i) => (
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
        </section>

        {/* Mapping info section */}
        <section className="animate-pulse rounded-lg bg-[#F5FAFA] p-6 shadow-sm shadow-header-top/5 sm:p-8">
          <div className="mb-1 h-6 w-40 rounded bg-zebra" />
          <div className="mb-4 h-4 w-72 max-w-full rounded bg-zebra" />
          <div className="rounded-lg bg-white/70 p-4 shadow-sm shadow-header-top/5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-md bg-[#DDF1F2]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-zebra" />
                <div className="h-3 w-36 rounded bg-zebra" />
                <div className="h-3 w-32 rounded bg-zebra" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
