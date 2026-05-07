/**
 * DataTable — tabla de datos con todos los estados necesarios
 *
 * UNA TABLA TIENE 4 ESTADOS. Si falta alguno, la UX se rompe:
 * 1. Loading  → esqueleto animado (no spinner centrado)
 * 2. Empty    → mensaje claro con acción
 * 3. Error    → qué salió mal + cómo recuperarse
 * 4. Con data → la tabla real
 *
 * PRINCIPIOS DE DISEÑO EN TABLAS:
 *
 * ALINEACIÓN:
 * - Texto:    alineado a la IZQUIERDA (legibilidad natural)
 * - Números:  alineados a la DERECHA (comparación vertical)
 * - Estado:   centrado solo si es icon/badge pequeño
 * - Acciones: alineadas a la DERECHA, siempre en la última columna
 *
 * CARGA COGNITIVA:
 * - Menos columnas = más comprensión. Prioriza las 4-6 más importantes.
 * - No muestres todo por default. Deja columnas opcionales.
 * - El header debe ser un sustantivo claro. No "F. Creación" → "Creado"
 *
 * DENSIDAD:
 * - compact: tablas de monitoreo, logs, muchas filas
 * - default: tablas de gestión de entidades
 * - relaxed: tablas con mucho contenido por fila, contenido visual
 *
 * RESPONSIVIDAD:
 * - En móvil, las tablas anchas no caben. Estrategias:
 *   a) Scroll horizontal (este componente — más simple)
 *   b) Card list en móvil (mejor UX, más código)
 *   c) Priorizar columnas con container queries
 */

import * as React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Tipos ────────────────────────────────────────────────────────── */
export type SortDirection = "asc" | "desc" | null

export interface ColumnDef<TData> {
  /** Clave única de la columna */
  key: string
  /** Texto del encabezado */
  header: string
  /** Cómo renderizar la celda */
  cell: (row: TData) => React.ReactNode
  /** Permite ordenar por esta columna */
  sortable?: boolean
  /** Clase CSS extra para th y td de esta columna */
  className?: string
  /** Alineación del contenido */
  align?: "left" | "center" | "right"
  /** Ancho mínimo en px (para tablas anchas) */
  minWidth?: number
}

export interface DataTableProps<TData> {
  /** Definición de columnas */
  columns: ColumnDef<TData>[]
  /** Datos a mostrar */
  data: TData[]
  /** Clave única por fila (para keys de React) */
  rowKey: (row: TData) => string | number
  /** Está cargando datos */
  loading?: boolean
  /** Error al cargar */
  error?: string | null
  /** Mensaje cuando no hay datos */
  emptyMessage?: string
  /** Descripción del estado vacío */
  emptyDescription?: string
  /** CTA en estado vacío */
  emptyAction?: React.ReactNode
  /** Densidad de las filas */
  density?: "compact" | "default" | "relaxed"
  /** Columna y dirección de ordenamiento actual */
  sortColumn?: string
  sortDirection?: SortDirection
  /** Callback al clickear un header sortable */
  onSort?: (column: string, direction: SortDirection) => void
  /** Callback al clickear una fila */
  onRowClick?: (row: TData) => void
  /** Muestra rayas zebra en las filas */
  striped?: boolean
  className?: string
}

/* ── Skeleton de carga ───────────────────────────────────────────── */
function TableSkeleton({
  columns,
  rows = 5,
  density = "default",
}: {
  columns: number
  rows?: number
  density?: "compact" | "default" | "relaxed"
}) {
  const rowPadding = {
    compact: "py-2",
    default: "py-3",
    relaxed: "py-4",
  }[density]

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-[var(--color-border)]">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className={cn("px-4", rowPadding)}>
              <div
                /* Ancho variable para que parezca contenido real */
                className={cn(
                  "h-4 rounded-[var(--radius-sm)]",
                  "bg-[var(--color-bg-muted)]",
                  "animate-pulse",
                  colIdx === 0 ? "w-1/2" : colIdx % 3 === 0 ? "w-3/4" : "w-2/3"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/* ── Estado vacío ────────────────────────────────────────────────── */
function EmptyState({
  message = "Sin resultados",
  description,
  action,
  colSpan,
}: {
  message?: string
  description?: string
  action?: React.ReactNode
  colSpan: number
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
          <Inbox
            size={40}
            className="text-[var(--color-text-muted)]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {message}
            </p>
            {description && (
              <p className="text-sm text-[var(--color-text-muted)]">
                {description}
              </p>
            )}
          </div>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </td>
    </tr>
  )
}

/* ── Estado de error ─────────────────────────────────────────────── */
function ErrorState({
  message,
  colSpan,
}: {
  message: string
  colSpan: number
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-16 px-6 gap-3 text-center">
          <AlertCircle
            size={40}
            className="text-[var(--color-danger-500)]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              Error al cargar los datos
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
          </div>
        </div>
      </td>
    </tr>
  )
}

/* ── Icono de sorting ────────────────────────────────────────────── */
function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc")
    return <ArrowUp size={14} className="text-[var(--color-brand-600)]" />
  if (direction === "desc")
    return <ArrowDown size={14} className="text-[var(--color-brand-600)]" />
  return (
    <ArrowUpDown
      size={14}
      className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
    />
  )
}

/* ── Componente principal ────────────────────────────────────────── */
function DataTable<TData>({
  columns,
  data,
  rowKey,
  loading = false,
  error = null,
  emptyMessage,
  emptyDescription,
  emptyAction,
  density = "default",
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  striped = false,
  className,
}: DataTableProps<TData>) {
  /* Padding de celdas según densidad */
  const cellPadding = {
    compact: "py-2 px-3",
    default: "py-3 px-4",
    relaxed: "py-4 px-4",
  }[density]

  /* Manejo del click en header sortable */
  function handleHeaderClick(column: ColumnDef<TData>) {
    if (!column.sortable || !onSort) return
    const nextDirection: SortDirection =
      sortColumn !== column.key
        ? "asc"
        : sortDirection === "asc"
        ? "desc"
        : sortDirection === "desc"
        ? null
        : "asc"
    onSort(column.key, nextDirection)
  }

  /* Alineación */
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  return (
    /* Scroll horizontal en pantallas pequeñas — no ocultar nunca */
    <div className={cn("w-full overflow-x-auto", className)}>
      <table
        className="w-full border-collapse text-sm"
        /* Accesibilidad: caption describe la tabla a screen readers */
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                className={cn(
                  cellPadding,
                  "font-medium text-[var(--color-text-secondary)]",
                  "bg-[var(--color-bg-subtle)]",
                  alignClass[column.align ?? "left"],
                  column.className
                )}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleHeaderClick(column)}
                    className={cn(
                      "group inline-flex items-center gap-1.5",
                      "cursor-pointer hover:text-[var(--color-text-primary)]",
                      "transition-colors duration-[var(--duration-fast)]",
                      "focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]",
                      "rounded-[var(--radius-sm)] -mx-1 px-1 py-0.5",
                      sortColumn === column.key &&
                        "text-[var(--color-text-primary)] font-semibold"
                    )}
                    aria-label={`Ordenar por ${column.header}${
                      sortColumn === column.key
                        ? sortDirection === "asc"
                          ? " (ascendente, click para descendente)"
                          : " (descendente, click para quitar orden)"
                        : ""
                    }`}
                  >
                    {column.header}
                    <SortIcon
                      direction={
                        sortColumn === column.key ? sortDirection ?? null : null
                      }
                    />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ────────────────────────────────────────────── */}
        <tbody>
          {/* Estado: cargando */}
          {loading && (
            <TableSkeleton
              columns={columns.length}
              rows={5}
              density={density}
            />
          )}

          {/* Estado: error */}
          {!loading && error && (
            <ErrorState message={error} colSpan={columns.length} />
          )}

          {/* Estado: vacío */}
          {!loading && !error && data.length === 0 && (
            <EmptyState
              message={emptyMessage}
              description={emptyDescription}
              action={emptyAction}
              colSpan={columns.length}
            />
          )}

          {/* Estado: datos */}
          {!loading &&
            !error &&
            data.map((row, rowIndex) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-[var(--color-border)]",
                  "transition-colors duration-[var(--duration-fast)]",
                  /* Fila clickeable */
                  onRowClick && "cursor-pointer hover:bg-[var(--color-bg-subtle)]",
                  /* Zebra striping */
                  striped &&
                    rowIndex % 2 === 1 &&
                    "bg-[var(--color-bg-page)]",
                  /* Hover siempre visible */
                  "hover:bg-[var(--color-bg-subtle)]"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      cellPadding,
                      "text-[var(--color-text-primary)]",
                      alignClass[column.align ?? "left"],
                      column.className
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export { DataTable }

/* ── EJEMPLO DE USO ──────────────────────────────────────────────────

  interface Product { id: string; name: string; price: number; status: string }

  const columns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: "Producto",
      sortable: true,
      cell: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      key: "price",
      header: "Precio",
      sortable: true,
      align: "right",  // ← números a la derecha
      cell: (row) => (
        <span className="font-mono">
          {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" })
            .format(row.price)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "success" : "default"} withDot>
          {row.status === "active" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Editar">
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Eliminar">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ]

  <DataTable
    columns={columns}
    data={products}
    rowKey={(p) => p.id}
    loading={isLoading}
    error={error?.message}
    emptyMessage="No hay productos"
    emptyDescription="Agrega tu primer producto para empezar."
    emptyAction={<Button size="sm">Agregar producto</Button>}
    sortColumn={sortCol}
    sortDirection={sortDir}
    onSort={(col, dir) => { setSortCol(col); setSortDir(dir) }}
    onRowClick={(p) => router.push(`/products/${p.id}`)}
  />
────────────────────────────────────────────────────────────────────── */
