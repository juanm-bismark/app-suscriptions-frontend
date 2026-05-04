/**
 * Barrel export del design system
 *
 * Importa desde aquí, no directamente de cada archivo:
 *
 * ✅ import { Button, Badge, Modal } from "@/components/ui"
 * ❌ import { Button } from "@/components/ui/button"
 *    import { Badge } from "@/components/ui/badge"
 *
 * Beneficios:
 * - Refactorizar la estructura interna no rompe imports
 * - Un solo lugar para ver qué está disponible
 * - Tree-shaking funciona igual (bundlers son inteligentes)
 */

export * from "./button"
export * from "./badge"
export * from "./modal"
export * from "./form"
export * from "./data-table"
export * from "./feedback"
