export default function CredentialsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      <div className="flex flex-col gap-2 mb-8">
        <div className="h-9 bg-zebra rounded w-52" />
        <div className="h-5 bg-zebra rounded w-96 max-w-full" />
      </div>

      <div className="overflow-hidden rounded-lg bg-[#F5FAFA] shadow-sm shadow-header-top/5">
        <div className="grid grid-cols-6 bg-[#EAF6F7] px-6 py-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-3 bg-[#D4E8EA] rounded" />
          ))}
        </div>
        {[1, 2, 3].map((item) => (
          <div key={item} className="grid grid-cols-6 px-6 py-4 gap-4">
            <div className="h-6 bg-[#DDF1F2] rounded w-24" />
            <div className="h-6 bg-[#DDF4EA] rounded-full w-20" />
            <div className="h-6 bg-[#F1F5F9] rounded-full w-20" />
            <div className="h-4 bg-zebra rounded" />
            <div className="h-4 bg-zebra rounded" />
            <div className="flex justify-end">
              <div className="h-7 bg-[#0F202A] rounded-md w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
