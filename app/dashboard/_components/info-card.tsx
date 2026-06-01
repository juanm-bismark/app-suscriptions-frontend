interface InfoCardProps {
  label: string
  children: React.ReactNode
}

export function InfoCard({ label, children }: InfoCardProps) {
  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border border-border/45">
      <label className="block text-xs sm:text-sm font-medium text-muted mb-2">{label}</label>
      {children}
    </div>
  )
}
