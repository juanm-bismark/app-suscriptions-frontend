import Link from "next/link"

export function SimImportHeader() {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Bootstrap de rutas</p>
        <h1 className="mt-2 text-3xl font-bold text-title">Importar SIMs</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Carga el mapa inicial de ICCID y proveedor para habilitar el listado global de suscripciones.
        </p>
      </div>
      <Link className="text-sm font-semibold text-header-bg hover:underline" href="/dashboard/subscriptions">
        Volver a suscripciones
      </Link>
    </div>
  )
}

