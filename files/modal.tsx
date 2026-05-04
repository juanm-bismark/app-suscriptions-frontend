/**
 * Modal — diálogo de overlay para flujos críticos
 *
 * CONSTRUIDO SOBRE: @radix-ui/react-dialog
 * Radix maneja GRATIS: focus trap, Escape para cerrar,
 * scroll lock, portal, aria-modal, aria-labelledby.
 * NO reimplementes esto manualmente.
 *
 * CUÁNDO USAR MODAL:
 * ✅ Confirmación de acción destructiva ("¿Eliminar esto?")
 * ✅ Formulario rápido que no merece página propia
 * ✅ Detalle ampliado de un item en tabla
 * ✅ Selección de opciones complejas (date picker, file picker)
 *
 * CUÁNDO NO USAR MODAL:
 * ❌ Mensajes de éxito → usa Toast
 * ❌ Formularios largos (>5 campos) → usa página dedicada
 * ❌ Información que el usuario necesita consultar mientras trabaja
 *    → usa un panel lateral (Sheet/Drawer)
 * ❌ Alertas no bloqueantes → usa Banner o Toast
 *
 * TAMAÑOS:
 * - sm (384px):  confirmaciones, alertas simples, 1-2 campos
 * - md (512px):  formularios medianos, detalles de entidad
 * - lg (640px):  formularios complejos, tablas de selección
 * - xl (768px):  editores, previews, galería
 * - full:        flujos de múltiples pasos
 *
 * CARGA COGNITIVA:
 * - Un modal hace UNA cosa. Si necesitas tabs dentro, probablemente
 *   necesitas una página propia.
 * - El título del modal debe ser el nombre de la acción, no "Modal"
 *   ni "Información". "Eliminar producto" es claro. "Advertencia" no.
 * - El botón de acción confirma con palabras, no solo "Aceptar".
 *   "Eliminar producto" > "Aceptar"
 */

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Primitivos re-exportados ────────────────────────────────────── */
const Modal = DialogPrimitive.Root
const ModalTrigger = DialogPrimitive.Trigger
const ModalPortal = DialogPrimitive.Portal
const ModalClose = DialogPrimitive.Close

/* ── Overlay (fondo oscuro) ──────────────────────────────────────── */
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      /* Posicionamiento */
      "fixed inset-0 z-[var(--z-modal)]",
      /* Color: negro muy suave, no opaco total — mantiene contexto */
      "bg-black/40 backdrop-blur-[2px]",
      /* Animación de entrada/salida usando data-state de Radix */
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      "duration-[var(--duration-normal)]",
      className
    )}
    {...props}
  />
))
ModalOverlay.displayName = "ModalOverlay"

/* ── Tamaños del contenido ───────────────────────────────────────── */
const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full mx-4",
} as const

type ModalSize = keyof typeof modalSizes

/* ── Contenido del modal ─────────────────────────────────────────── */
interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: ModalSize
  /** Muestra el botón X de cerrar */
  showCloseButton?: boolean
}

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(
  (
    { className, size = "md", showCloseButton = true, children, ...props },
    ref
  ) => (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          /* Posicionamiento: centrado vertical y horizontal */
          "fixed left-1/2 top-1/2 z-[var(--z-modal)]",
          "-translate-x-1/2 -translate-y-1/2",
          /* Layout */
          "w-full",
          modalSizes[size],
          /* Visual */
          "bg-[var(--color-bg-surface)]",
          "rounded-[var(--radius-xl)]",
          "border border-[var(--color-border)]",
          "shadow-[var(--shadow-xl)]",
          /* Scroll interno si el contenido es muy largo */
          "max-h-[90dvh] overflow-y-auto",
          /* Animación: entra desde abajo sutilmente */
          "data-[state=open]:animate-in",
          "data-[state=open]:fade-in-0",
          "data-[state=open]:slide-in-from-bottom-4",
          "data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0",
          "data-[state=closed]:slide-out-to-bottom-4",
          "data-[state=closed]:zoom-out-95",
          "duration-[var(--duration-slow)]",
          className
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4",
              "rounded-[var(--radius-sm)]",
              "p-1.5",
              "text-[var(--color-text-muted)]",
              "hover:bg-[var(--color-bg-subtle)]",
              "hover:text-[var(--color-text-secondary)]",
              "transition-colors duration-[var(--duration-fast)]",
              "focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]",
            )}
            aria-label="Cerrar"
          >
            <X size={16} aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </ModalPortal>
  )
)
ModalContent.displayName = "ModalContent"

/* ── Secciones del modal ─────────────────────────────────────────── */

/**
 * ModalHeader: contiene título y descripción opcional.
 * El padding inferior es menor para separar header del body
 * con el borde visual del contenido, no con espacio excesivo.
 */
const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1.5",
      "px-6 pt-6 pb-4",
      className
    )}
    {...props}
  />
)
ModalHeader.displayName = "ModalHeader"

/**
 * ModalBody: contenido principal.
 * Si hay un header, el padding-top es menor (ya viene del header).
 */
const ModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-6 py-4", className)}
    {...props}
  />
)
ModalBody.displayName = "ModalBody"

/**
 * ModalFooter: acciones del modal.
 * SIEMPRE al final. Orden recomendado: [Cancelar] [Acción principal]
 * La acción destructiva va a la DERECHA — el usuario la busca ahí.
 * El cancelar va a la izquierda — fácil de escapar.
 */
const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-end gap-3",
      "px-6 py-4 pt-2",
      /* Separador visual del body */
      "border-t border-[var(--color-border)]",
      "mt-2",
      /* En móvil: los botones van full-width en columna */
      "sm:flex-row flex-col-reverse",
      className
    )}
    {...props}
  />
)
ModalFooter.displayName = "ModalFooter"

/* Radix primitivos tipados para título y descripción */
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight",
      "text-[var(--color-text-primary)]",
      "pr-8", /* espacio para el botón de cerrar */
      className
    )}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm text-[var(--color-text-secondary)]",
      "leading-relaxed",
      className
    )}
    {...props}
  />
))
ModalDescription.displayName = "ModalDescription"

export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
}

/* ── EJEMPLOS DE USO ─────────────────────────────────────────────────

  // 1. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
  <Modal>
    <ModalTrigger asChild>
      <Button variant="danger-outline" size="sm">Eliminar</Button>
    </ModalTrigger>
    <ModalContent size="sm">
      <ModalHeader>
        <ModalTitle>Eliminar producto</ModalTitle>
        <ModalDescription>
          Esta acción no se puede deshacer. El producto será eliminado
          permanentemente de tu inventario.
        </ModalDescription>
      </ModalHeader>
      <ModalFooter>
        <ModalClose asChild>
          <Button variant="ghost">Cancelar</Button>
        </ModalClose>
        <Button variant="danger" onClick={handleDelete}>
          Eliminar producto
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>

  // 2. MODAL DE FORMULARIO
  <Modal>
    <ModalTrigger asChild>
      <Button leftIcon={<Plus size={16} />}>Nuevo cliente</Button>
    </ModalTrigger>
    <ModalContent size="md">
      <ModalHeader>
        <ModalTitle>Agregar cliente</ModalTitle>
        <ModalDescription>
          Completa los datos básicos. Podrás editarlos después.
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <form id="new-client-form" onSubmit={handleSubmit}>
          ... campos del formulario ...
        </form>
      </ModalBody>
      <ModalFooter>
        <ModalClose asChild>
          <Button variant="secondary">Cancelar</Button>
        </ModalClose>
        <Button type="submit" form="new-client-form" loading={isSubmitting}>
          Guardar cliente
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
────────────────────────────────────────────────────────────────────── */
