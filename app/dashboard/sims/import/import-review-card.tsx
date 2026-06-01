import { SourceBadge } from "@/app/dashboard/_components/source-badge"
import { Card } from "@/components/ui"
import type { Provider } from "@/lib/types/api"

export function SimImportReviewCard({
  activeProviders,
  providerCounts,
}: {
  activeProviders: Provider[]
  providerCounts: { provider: Provider; count: number }[]
}) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-title">Revision</h2>
      <p className="mt-1 text-sm text-muted">Solo se aceptan proveedores con credencial activa.</p>

      <div className="mt-5 space-y-3">
        {providerCounts.map(({ provider, count }) => (
          <div key={provider} className="flex items-center justify-between gap-3 rounded border border-border/45 bg-page px-3 py-2">
            <SourceBadge source={provider} withName />
            <span className="font-mono text-sm font-semibold text-title">{count}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-border/45 bg-page p-4 text-sm text-muted">
        <p className="font-semibold text-title">Reglas</p>
        <p className="mt-2">
          Cada fila debe tener ICCID no vacio y proveedor en {activeProviders.length > 0 ? activeProviders.join(", ") : "un proveedor activo"}.
        </p>
      </div>
    </Card>
  )
}

