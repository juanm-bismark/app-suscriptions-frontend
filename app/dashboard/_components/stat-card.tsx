interface StatCardProps {
  label: string
  value: string
  icon?: React.ReactNode
  color?: string
}

export function StatCard({
  label,
  value,
  icon,
  color = "text-header-accent",
}: StatCardProps) {
  return (
    <div className="bg-white border border-divider rounded-lg p-4 hover:shadow-sm transition-shadow">
      {icon && (
        <div className={`flex items-center justify-between mb-3`}>
          <p className="text-xs text-muted font-medium">{label}</p>
          <div className={color}>{icon}</div>
        </div>
      )}
      {!icon && <p className="text-xs text-muted font-medium mb-3">{label}</p>}
      <p className="text-2xl font-bold text-title">{value}</p>
    </div>
  )
}
