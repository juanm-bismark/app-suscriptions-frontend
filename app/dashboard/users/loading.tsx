export default function UsersLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <div className="h-9 bg-zebra rounded w-40 mb-2" />
          <div className="h-5 bg-zebra rounded w-96 max-w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#F5FAFA] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
          <div className="h-6 bg-zebra rounded w-40 mb-4" />
          <div className="overflow-hidden rounded-lg">
            <div className="grid grid-cols-2 bg-[#EAF6F7] px-6 py-3">
              <div className="h-3 bg-[#D4E8EA] rounded w-20" />
              <div className="h-3 bg-[#D4E8EA] rounded w-16" />
            </div>
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="grid grid-cols-2 px-6 py-4">
                <div className="h-4 bg-zebra rounded w-36" />
                <div className="h-6 bg-[#DDF4EA] rounded-full w-20" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8 self-start">
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
            <div className="h-10 bg-[#0F202A] rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
