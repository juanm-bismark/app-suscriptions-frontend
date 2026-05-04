/**
 * Form — campos de formulario accesibles y consistentes
 *
 * CONSTRUIDO SOBRE: react-hook-form + zod + @radix-ui/react-label
 *
 * PRINCIPIOS DE BUENOS FORMULARIOS:
 *
 * 1. UNA COLUMNA (casi siempre)
 *    Dos columnas parecen más eficientes pero aumentan errores.
 *    Los usuarios escanean en F-pattern, no en grid.
 *    Excepción: campos cortos relacionados (ciudad/código postal).
 *
 * 2. LABEL SIEMPRE VISIBLE
 *    Placeholder no reemplaza al label. Al escribir, desaparece
 *    y el usuario pierde contexto de qué campo es.
 *    Label arriba del campo, nunca flotante ni solo placeholder.
 *
 * 3. MENSAJES DE ERROR ESPECÍFICOS
 *    Mal: "Campo requerido"
 *    Bien: "Ingresa tu correo electrónico"
 *    Mal: "Email inválido"
 *    Bien: "El correo debe tener el formato usuario@dominio.com"
 *
 * 4. VALIDACIÓN EN EL MOMENTO CORRECTO
 *    - onBlur al salir del campo (no en cada keystroke)
 *    - onSubmit para la revisión final
 *    - NO onChange (es irritante mientras escribe)
 *
 * 5. TAMAÑO DE ÁREA CLICABLE
 *    El label debe ser clickeable y mover el foco al input.
 *    Label + Input deben ser ≥44px de altura en móvil.
 *
 * 6. AUTOCOMPLETE
 *    Siempre define autocomplete. Ayuda a gestores de contraseñas
 *    y a usuarios con problemas motores (menos escritura).
 */

"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

/* ── Label ───────────────────────────────────────────────────────── */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean
  }
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none",
      "text-[var(--color-text-primary)]",
      /* Cuando el input asociado está deshabilitado */
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
      className
    )}
    {...props}
  >
    {children}
    {/* Asterisco semántico para campos requeridos */}
    {required && (
      <span
        className="ml-1 text-[var(--color-danger-500)]"
        aria-hidden="true" /* El "requerido" real viene de aria-required en el input */
      >
        *
      </span>
    )}
  </LabelPrimitive.Root>
))
Label.displayName = "Label"

/* ── Input ───────────────────────────────────────────────────────── */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", hasError = false, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        /* Layout */
        "flex h-10 w-full",
        "px-3 py-2",
        /* Tipografía */
        "text-sm text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-muted)]",
        /* Visual base */
        "bg-[var(--color-bg-surface)]",
        "rounded-[var(--radius-md)]",
        "border border-[var(--color-border)]",
        "shadow-[var(--shadow-xs)]",
        /* Transición suave */
        "transition-colors duration-[var(--duration-fast)]",
        /* Estados interactivos */
        "hover:border-[var(--color-border-strong)]",
        "focus-visible:border-[var(--color-focus-ring)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]/20",
        "focus-visible:outline-none",
        /* Estado de error — borde rojo, ring rojo */
        hasError && [
          "border-[var(--color-danger-500)]",
          "focus-visible:border-[var(--color-danger-500)]",
          "focus-visible:ring-[var(--color-danger-500)]/20",
        ],
        /* Disabled */
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-bg-subtle)]",
        /* Peer class para que Label reaccione a este estado */
        "peer",
        className
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  )
)
Input.displayName = "Input"

/* ── Textarea ────────────────────────────────────────────────────── */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full",
        "px-3 py-2",
        "text-sm text-[var(--color-text-primary)]",
        "placeholder:text-[var(--color-text-muted)]",
        "bg-[var(--color-bg-surface)]",
        "rounded-[var(--radius-md)]",
        "border border-[var(--color-border)]",
        "shadow-[var(--shadow-xs)]",
        "resize-y", /* Solo vertical, evita que rompa layout horizontal */
        "transition-colors duration-[var(--duration-fast)]",
        "hover:border-[var(--color-border-strong)]",
        "focus-visible:border-[var(--color-focus-ring)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]/20",
        "focus-visible:outline-none",
        hasError && [
          "border-[var(--color-danger-500)]",
          "focus-visible:border-[var(--color-danger-500)]",
          "focus-visible:ring-[var(--color-danger-500)]/20",
        ],
        "disabled:cursor-not-allowed disabled:opacity-50",
        "peer",
        className
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

/* ── FieldGroup — contenedor de campo con label + input + error ─── */
/**
 * FieldGroup agrupa semánticamente label, input y mensaje de error.
 * Es el bloque atómico de construcción de formularios.
 *
 * Conecta automáticamente el label al input con IDs generados,
 * y el error con aria-describedby para accesibilidad.
 */
interface FieldGroupProps {
  label: string
  children: React.ReactNode
  /** Mensaje de error a mostrar */
  error?: string
  /** Texto de ayuda debajo del campo */
  hint?: string
  /** El campo es obligatorio */
  required?: boolean
  className?: string
}

function FieldGroup({
  label,
  children,
  error,
  hint,
  required,
  className,
}: FieldGroupProps) {
  const id = React.useId()
  const inputId = `field-${id}`
  const errorId = `error-${id}`
  const hintId = `hint-${id}`

  /* Clona el child y le pasa las props de accesibilidad */
  const childWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: inputId,
        hasError: !!error,
        "aria-required": required || undefined,
        "aria-describedby": [error && errorId, hint && hintId]
          .filter(Boolean)
          .join(" ") || undefined,
      })
    : children

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={inputId} required={required}>
        {label}
      </Label>

      {childWithProps}

      {/* Hint: información de ayuda contextual (antes del error) */}
      {hint && !error && (
        <p
          id={hintId}
          className="text-xs text-[var(--color-text-muted)] leading-relaxed"
        >
          {hint}
        </p>
      )}

      {/* Error: reemplaza al hint si hay error */}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-[var(--color-danger-500)] leading-relaxed flex items-start gap-1"
        >
          <span aria-hidden="true">↑</span>
          {error}
        </p>
      )}
    </div>
  )
}

/* ── FormSection — agrupa campos relacionados ─────────────────────── */
/**
 * Agrupa campos con un título de sección.
 * Útil en formularios de más de 6 campos.
 * Ley de Gestalt: agrupa lo relacionado visualmente.
 */
function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      <legend className="sr-only">{title}</legend>
      {/* Versión visual del legend (no el nativo, difícil de estilizar) */}
      <div className="space-y-0.5 pb-4 border-b border-[var(--color-border)]">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </p>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {children}
    </fieldset>
  )
}

export { Label, Input, Textarea, FieldGroup, FormSection }

/* ── EJEMPLO CON REACT-HOOK-FORM + ZOD ───────────────────────────────

  import { z } from "zod"
  import { useForm } from "react-hook-form"
  import { zodResolver } from "@hookform/resolvers/zod"

  const schema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.email("Ingresa un correo válido (usuario@dominio.com)"),
    phone: z.string().optional(),
    notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  })

  function ClientForm() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
      resolver: zodResolver(schema),
      mode: "onBlur", // valida al salir del campo
    })

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormSection title="Datos personales">
          <FieldGroup label="Nombre completo" required error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder="Ej: María García"
              autoComplete="name"
            />
          </FieldGroup>

          <FieldGroup
            label="Correo electrónico"
            required
            error={errors.email?.message}
            hint="Recibirás confirmaciones en esta dirección"
          >
            <Input
              {...register("email")}
              type="email"
              placeholder="usuario@empresa.com"
              autoComplete="email"
            />
          </FieldGroup>

          <FieldGroup label="Notas" error={errors.notes?.message}>
            <Textarea
              {...register("notes")}
              placeholder="Observaciones adicionales..."
              rows={4}
            />
          </FieldGroup>
        </FormSection>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Guardar cliente
          </Button>
        </div>
      </form>
    )
  }
────────────────────────────────────────────────────────────────────── */
