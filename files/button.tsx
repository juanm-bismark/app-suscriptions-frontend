/**
 * Button — componente de acción principal
 *
 * DECISIONES DE DISEÑO:
 *
 * 1. VARIANTES, no props booleanas (isOutlined, isDanger, etc.)
 *    ❌ <Button isPrimary isDanger isSmall isLoading />
 *    ✅ <Button variant="danger" size="sm" loading />
 *    → Limita combinaciones inválidas, autocompletado claro.
 *
 * 2. CVA (class-variance-authority) para variantes tipadas
 *    → Cada combinación variant+size tiene estilos predefinidos.
 *    → El compilador detecta props inválidas.
 *
 * 3. asChild (patrón Radix) para polimorfismo
 *    → <Button asChild><Link href="/about">Ir</Link></Button>
 *    → Evita el problema de <a> dentro de <button>.
 *
 * 4. Estado loading bloquea el botón automáticamente
 *    → Previene doble submit sin lógica extra en el formulario.
 *
 * 5. Colores de estado solo cuando aportan valor semántico:
 *    - primary: acción principal de la página (uno por vista)
 *    - secondary: acciones secundarias frecuentes
 *    - ghost: acciones de baja jerarquía (no compiten visualmente)
 *    - danger: destrucción de datos (rojo = señal universal de alerta)
 *    - link: navegación inline
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Definición de variantes ─────────────────────────────────────────
   Cada variante es un contrato visual explícito.
   Cambia estilos aquí → cambia en TODA la app.
────────────────────────────────────────────────────────────────────── */
const buttonVariants = cva(
  /* Base: comportamiento universal de todos los botones */
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium leading-none whitespace-nowrap",
    "rounded-[var(--radius-md)]",
    "border border-transparent",
    "transition-all duration-[var(--duration-normal)]",
    "cursor-pointer select-none",
    /* Accesibilidad: focus visible claro */
    "focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-2",
    /* Estado disabled: reduce opacidad, bloquea eventos */
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        /* Acción principal: CTA, submit, acción destructiva revertida */
        primary: [
          "bg-[var(--color-action-bg)] text-[var(--color-action-text)]",
          "hover:bg-[var(--color-action-bg-hover)]",
          "active:scale-[0.98]",
          "shadow-[var(--shadow-xs)]",
        ],

        /* Acción secundaria: importancia media, no compite con primary */
        secondary: [
          "bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)]",
          "border-[var(--color-border)]",
          "hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-border-strong)]",
          "active:scale-[0.98]",
        ],

        /* Baja jerarquía: acciones que no deben llamar la atención */
        ghost: [
          "bg-transparent text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]",
        ],

        /* Peligro: eliminar, revocar, acción irreversible */
        danger: [
          "bg-[var(--color-danger-500)] text-white",
          "hover:bg-[var(--color-danger-700)]",
          "active:scale-[0.98]",
          "shadow-[var(--shadow-xs)]",
        ],

        /* Danger outline: versión menos agresiva para confirmar antes */
        "danger-outline": [
          "bg-transparent text-[var(--color-danger-500)]",
          "border-[var(--color-danger-500)]",
          "hover:bg-[var(--color-danger-50)]",
        ],

        /* Link: navegación inline, sin apariencia de botón */
        link: [
          "bg-transparent text-[var(--color-text-link)]",
          "underline-offset-4 hover:underline",
          "p-0 h-auto", /* override de padding/height */
        ],
      },

      size: {
        /* xs: acciones en tablas, chips, tags compactos */
        xs: "h-7 px-2.5 text-xs rounded-[var(--radius-sm)]",
        /* sm: acciones secundarias en formularios, dentro de cards */
        sm: "h-8 px-3 text-sm",
        /* md: tamaño por defecto, la mayoría de acciones */
        md: "h-10 px-4 text-sm",
        /* lg: CTA principal, hero sections, acciones de alto impacto */
        lg: "h-11 px-6 text-base",
        /* icon: botones sin texto (iconos solos) */
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-xs": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

/* ── Props tipadas ───────────────────────────────────────────────────
   Extender HTMLButtonElement permite pasar cualquier atributo
   nativo (type, form, aria-*, data-*, etc.) sin redefinirlos.
────────────────────────────────────────────────────────────────────── */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  /** Icono a la izquierda del texto */
  leftIcon?: React.ReactNode
  /** Icono a la derecha del texto */
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        ref={ref}
        disabled={isDisabled}
        /* aria-busy informa a lectores de pantalla que hay una
           operación en curso, incluso si el botón no dice "Cargando" */
        aria-busy={loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {/* Spinner: reemplaza el icono izquierdo durante carga */}
        {loading ? (
          <Loader2
            className="animate-spin"
            size={size === "xs" || size === "sm" ? 14 : 16}
            aria-hidden="true"
          />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}

        {/* Texto: hidden visually en icon buttons pero presente para screen readers */}
        {children}

        {/* Icono derecho: no se muestra en modo loading */}
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }

/* ── CUÁNDO USAR CADA VARIANTE ───────────────────────────────────────

  primary    → UNA por página/sección. Es el paso que quieres que tome.
               "Guardar", "Continuar", "Confirmar pedido"

  secondary  → Alternativa al primary. No compite, complementa.
               "Cancelar" junto a "Guardar", "Ver detalles"

  ghost      → Acciones de servicio, menú de opciones, icons en tablas.
               No debe robar atención. "Editar", "Copiar", "···"

  danger     → Acciones IRREVERSIBLES. Siempre pide confirmación antes.
               Nunca lo uses como botón de cancelar o volver.
               "Eliminar cuenta", "Borrar todos los datos"

  danger-outline → Primer paso antes de danger. En el modal de
               confirmación puede ir un danger-outline que escala a
               danger al confirmar. Menos alarma, misma semántica.

  link       → Navegación inline dentro de texto o como alternativa
               a un secondary cuando el espacio es muy reducido.

  REGLA DE ORO: Si tienes más de 2 botones en una fila, algo está mal.
  Jerarquía clara: primary > secondary > ghost. Un solo primary.
────────────────────────────────────────────────────────────────────── */
