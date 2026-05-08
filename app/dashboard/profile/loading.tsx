export default function ProfileLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      <div className="mb-8">
        <div className="h-9 bg-zebra rounded w-40 mb-2" />
        <div className="h-5 bg-zebra rounded w-72 max-w-full" />
      </div>

      <div className="bg-[#DDF1F2] rounded-lg shadow-sm shadow-header-top/5 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <div key={item}>
              <div className="h-4 bg-[#C8E8EA] rounded w-28 mb-2" />
              <div className="h-11 bg-white/55 rounded-md shadow-sm shadow-header-top/5" />
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="h-4 bg-[#C8E8EA] rounded w-32 mb-2" />
            <div className="h-10 bg-white/80 rounded-md shadow-sm shadow-header-top/5" />
          </div>
          <div className="h-10 bg-[#0F202A] rounded-md w-40" />
        </div>
      </div>
    </div>
  )
}
