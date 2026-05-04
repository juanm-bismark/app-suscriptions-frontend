/**
 * Badge — indicador de estado, categoría o conteo
 *
 * CUÁNDO USAR BADGES:
 * ✅ Estado de un registro (Activo, Pendiente, Archivado)
 * ✅ Categorías o etiquetas (CRM: Lead, Cliente, Proveedor)
 * ✅ Conteos (notificaciones, items en carrito)
 * ✅ Prioridades (Alta, Media, Baja)
 *
 * CUÁNDO NO USAR:
 * ❌ Como botones — si es clickable, usa Button
 * ❌ Para texto largo — máx. 2-3 palabras
 * ❌ Más de 3-4 badges diferentes en una tabla — confunde
 *
 * FILOSOFÍA DE COLOR EN BADGES:
 * El color solo tiene sentido cuando es consistente y semántico.
 * "Verde = activo/bien" y "Rojo = error/mal" son convenciones
 * universales. Úsalas. No uses colores decorativos aquí.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  /* Base */
  [
    "inline-flex items-center gap-1.5",
    "px-2 py-0.5",
    "text-xs font-medium leading-none",
    "rounded-[var(--radius-full)]",
    "border",
    "transition-colors duration-[var(--duration-fast)]",
    "select-none whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        /* Default: neutro, sin semántica de color */
        default: [
          "bg-[var(--color-bg-subtle)]",
          "text-[var(--color-text-secondary)]",
          "border-[var(--color-border)]",
        ],

        /* Success: activo, completado, aprobado, en línea */
        success: [
          "bg-[var(--color-success-50)]",
          "text-[var(--color-success-700)]",
          "border-[oklch(0.7_0.15_155)]",
        ],

        /* Warning: pendiente, en revisión, atención requerida */
        warning: [
          "bg-[var(--color-warning-50)]",
          "text-[var(--color-warning-700)]",
          "border-[oklch(0.85_0.15_85)]",
        ],

        /* Danger: error, rechazado, inactivo, vencido */
        danger: [
          "bg-[var(--color-danger-50)]",
          "text-[var(--color-danger-700)]",
          "border-[oklch(0.8_0.15_25)]",
        ],

        /* Brand: destacado, nuevo, featured */
        brand: [
          "bg-[var(--color-brand-50)]",
          "text-[var(--color-brand-700)]",
          "border-[var(--color-brand-200)]",
        ],

        /* Outline: sin fondo, solo borde — para categorías, tags */
        outline: [
          "bg-transparent",
          "text-[var(--color-text-secondary)]",
          "border-[var(--color-border-strong)]",
        ],
      },

      /* dot: agrega un punto de color antes del texto
         Útil para estados en tiempo real (online/offline) */
      withDot: {
        true: "pl-1.5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      withDot: false,
    },
  }
)

/* Mapa de color del punto al variant */
const dotColorMap: Record<string, string> = {
  default: "bg-[var(--color-gray-400)]",
  success: "bg-[var(--color-success-500)]",
  warning: "bg-[var(--color-warning-500)]",
  danger: "bg-[var(--color-danger-500)]",
  brand: "bg-[var(--color-brand-500)]",
  outline: "bg-[var(--color-gray-400)]",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant = "default",
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, withDot }), className)}
      {...props}
    >
      {withDot && (
        <span
          className={cn(
            "inline-block w-1.5 h-1.5 rounded-full shrink-0",
            dotColorMap[variant ?? "default"]
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }

/* ── EJEMPLOS DE USO ─────────────────────────────────────────────────

  // Estado de un pedido
  <Badge variant="warning" withDot>Pendiente</Badge>
  <Badge variant="success" withDot>Completado</Badge>
  <Badge variant="danger"  withDot>Cancelado</Badge>

  // Categoría o tipo (sin dot, sin semántica de color)
  <Badge variant="outline">Premium</Badge>
  <Badge variant="default">Admin</Badge>

  // Nueva feature
  <Badge variant="brand">Nuevo</Badge>

  ACCESIBILIDAD: Si el badge comunica información importante,
  asegúrate de que el texto sea suficiente (no solo color).
  Mal: <Badge variant="danger">•</Badge>
  Bien: <Badge variant="danger" withDot>Vencido</Badge>
────────────────────────────────────────────────────────────────────── */
