/**
 * Feedback — componentes de retroalimentación al usuario
 *
 * JERARQUÍA DE FEEDBACK (de menos a más intrusivo):
 *
 * 1. Inline error/success     → dentro del formulario o componente
 * 2. Toast / Snackbar         → esquina de pantalla, desaparece solo
 * 3. Banner / Alert           → dentro de la página, persiste
 * 4. Modal de confirmación    → bloquea la pantalla, requiere acción
 *
 * CUÁNDO USAR CADA UNO:
 *
 * Toast:
 * ✅ Confirmación de acción completada ("Guardado", "Copiado")
 * ✅ Errores no críticos que no impiden continuar
 * ❌ Errores que requieren acción del usuario → usa Banner o Modal
 * ❌ Información que el usuario necesita leer completa
 * ❌ Más de 1 toast a la vez (muy confuso)
 *
 * Alert/Banner:
 * ✅ Advertencias de sesión (va a expirar en 5 min)
 * ✅ Estado de onboarding incompleto
 * ✅ Límites de plan alcanzados
 * ✅ Mensajes de error de formulario globales
 * ❌ Mensajes de éxito transitorios → usa Toast
 *
 * COLORES DE FEEDBACK:
 * El color solo con texto, nunca solo. Un usuario daltónico
 * debe entender el estado sin depender del color.
 * Siempre: ícono semántico + texto descriptivo + (color de apoyo)
 */

import * as React from "react"
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

/* ── Alert / Banner ──────────────────────────────────────────────── */
type AlertVariant = "info" | "success" | "warning" | "danger"

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  /** Acción opcional (link o botón pequeño) */
  action?: React.ReactNode
  /** Permite cerrar el alert */
  onDismiss?: () => void
  className?: string
}

const alertConfig: Record<
  AlertVariant,
  { icon: React.ElementType; bg: string; border: string; iconColor: string; titleColor: string; textColor: string }
> = {
  info: {
    icon: Info,
    bg: "bg-[var(--color-brand-50)]",
    border: "border-[var(--color-brand-200)]",
    iconColor: "text-[var(--color-brand-600)]",
    titleColor: "text-[var(--color-brand-900)]",
    textColor: "text-[var(--color-brand-800)]",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-[var(--color-success-50)]",
    border: "border-[oklch(0.7_0.15_155)]",
    iconColor: "text-[var(--color-success-700)]",
    titleColor: "text-[var(--color-success-700)]",
    textColor: "text-[var(--color-success-700)]",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-[var(--color-warning-50)]",
    border: "border-[oklch(0.85_0.15_85)]",
    iconColor: "text-[var(--color-warning-700)]",
    titleColor: "text-[var(--color-warning-700)]",
    textColor: "text-[var(--color-warning-700)]",
  },
  danger: {
    icon: AlertCircle,
    bg: "bg-[var(--color-danger-50)]",
    border: "border-[oklch(0.8_0.15_25)]",
    iconColor: "text-[var(--color-danger-700)]",
    titleColor: "text-[var(--color-danger-700)]",
    textColor: "text-[var(--color-danger-700)]",
  },
}

function Alert({
  variant = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}: AlertProps) {
  const config = alertConfig[variant]
  const Icon = config.icon

  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn(
        "relative flex gap-3 p-4",
        "rounded-[var(--radius-lg)]",
        "border",
        config.bg,
        config.border,
        className
      )}
    >
      {/* Ícono semántico: accesible y visible */}
      <Icon
        size={18}
        className={cn("shrink-0 mt-0.5", config.iconColor)}
        aria-hidden="true"
      />

      <div className="flex-1 space-y-1 min-w-0">
        {title && (
          <p className={cn("text-sm font-semibold leading-tight", config.titleColor)}>
            {title}
          </p>
        )}
        <div className={cn("text-sm leading-relaxed", config.textColor)}>
          {children}
        </div>
        {action && <div className="mt-3">{action}</div>}
      </div>

      {/* Botón de cerrar */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDismiss}
          className={cn("shrink-0 -mr-1 -mt-1", config.iconColor)}
          aria-label="Cerrar notificación"
        >
          <X size={14} aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

/* ── EmptyState — cuando no hay datos ───────────────────────────── */
/**
 * Estados vacíos bien diseñados:
 * ✅ Explican POR QUÉ está vacío
 * ✅ Ofrecen la SIGUIENTE ACCIÓN obvia
 * ✅ Son amigables, no técnicos
 * ❌ No dicen solo "No hay resultados"
 * ❌ No muestran errores técnicos
 *
 * Tipos de estados vacíos:
 * - "first-time": el usuario nunca ha creado nada → invita a empezar
 * - "no-results": hay datos pero la búsqueda no encontró nada → sugiere cambiar filtros
 * - "filtered": tabla filtrada sin resultados → sugiere quitar filtros
 */
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  /** Acción secundaria (ej: "Limpiar filtros") */
  secondaryAction?: React.ReactNode
  className?: string
}

function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "py-16 px-6 text-center",
        "gap-4",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "p-4 rounded-[var(--radius-xl)]",
            "bg-[var(--color-bg-subtle)]",
            "text-[var(--color-text-muted)]"
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

/* ── Skeleton — placeholder de carga ─────────────────────────────── */
/**
 * Skeletons > Spinners en la mayoría de casos.
 * Un skeleton muestra DÓNDE van a aparecer los datos,
 * reduciendo la percepción de tiempo de carga.
 * Un spinner solo dice "espera, algo está pasando".
 *
 * USA SPINNER cuando:
 * - La operación es muy rápida (<300ms) y sería molesto ver el skeleton
 * - El contenido no tiene forma definida (procesos en background)
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)]",
        "bg-[var(--color-bg-muted)]",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

/* Skeleton de card — agrupa varios skeletons en forma de card */
function SkeletonCard() {
  return (
    <div className="p-4 border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export { Alert, EmptyState, Skeleton, SkeletonCard }

/* ── EJEMPLOS DE USO ─────────────────────────────────────────────────

  // Alert de advertencia con acción
  <Alert
    variant="warning"
    title="Tu plan vence pronto"
    action={
      <Button size="sm" variant="secondary">
        Renovar plan
      </Button>
    }
    onDismiss={() => dismiss()}
  >
    Tienes 3 días restantes en tu plan Professional.
    Después de ese momento no podrás crear nuevos proyectos.
  </Alert>

  // Estado vacío - primera vez
  <EmptyState
    icon={<Package size={32} />}
    title="No tienes productos aún"
    description="Agrega tu primer producto para comenzar a gestionar tu inventario."
    action={<Button leftIcon={<Plus size={16} />}>Agregar producto</Button>}
  />

  // Estado vacío - sin resultados de búsqueda
  <EmptyState
    icon={<Search size={32} />}
    title="Sin resultados para "laptop""
    description="Prueba con otros términos o revisa que no haya errores de escritura."
    action={
      <Button variant="secondary" onClick={() => setSearch("")}>
        Limpiar búsqueda
      </Button>
    }
  />

  // Skeleton durante carga
  {isLoading ? (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  ) : (
    <ProductGrid products={products} />
  )}
────────────────────────────────────────────────────────────────────── */
