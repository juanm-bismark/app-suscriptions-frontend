# Arquitectura y Convenciones del Proyecto

## Estructura de carpetas

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rutas — no afecta URL
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Layout compartido de auth
│   ├── (dashboard)/              # Rutas protegidas
│   │   ├── layout.tsx            # Layout con sidebar/navbar
│   │   ├── page.tsx              # /  → dashboard home
│   │   ├── clients/
│   │   │   ├── page.tsx          # /clients → lista
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # /clients/123 → detalle
│   │   │   └── _components/      # Componentes PRIVADOS de esta ruta
│   │   │       ├── client-table.tsx
│   │   │       └── client-form.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── globals.css               # Tokens + estilos base
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # Design system — primitivos reutilizables
│   │   ├── button.tsx            # Nunca tiene lógica de negocio
│   │   ├── modal.tsx
│   │   ├── data-table.tsx
│   │   ├── form.tsx
│   │   ├── badge.tsx
│   │   └── feedback.tsx
│   └── shared/                   # Componentes de negocio reutilizables
│       ├── user-avatar.tsx       # Avatar con foto + iniciales fallback
│       ├── page-header.tsx       # Header de página con breadcrumb
│       └── confirm-dialog.tsx    # Modal de confirmación genérico
│
├── lib/
│   ├── utils.ts                  # cn(), formatDate(), etc.
│   ├── api.ts                    # Funciones de fetch tipadas
│   └── constants.ts              # ROLES, PLAN_LIMITS, etc.
│
├── hooks/                        # Custom hooks reutilizables
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   └── use-pagination.ts
│
├── types/                        # Tipos globales compartidos
│   ├── api.ts                    # Tipos de respuestas de API
│   └── index.ts                  # Re-exportaciones
│
└── auth.ts                       # Configuración de next-auth
```

---

## Reglas de componentes

### ui/ — Design System
- **Sin lógica de negocio**. Un Button no sabe qué hace al clickearse.
- **Sin fetch**. Un DataTable recibe data como prop, no la pide sola.
- **Altamente configurables** con props y variantes.
- **Documentados** con JSDoc y comentarios de cuándo usar/no usar.

### shared/ — Componentes de negocio
- **Pueden tener lógica de dominio** (UserAvatar sabe cómo generar iniciales).
- **Reutilizables entre múltiples rutas**.
- **No** deben ser tan genéricos como ui/.

### app/*/_components/ — Componentes de ruta
- **Privados a esa ruta**. El prefijo `_` los excluye del routing de Next.js.
- Pueden tener fetch directo, llamadas a API, estado local.
- No se importan desde otras rutas.

---

## Convenciones de nomenclatura

```
PascalCase    → componentes React, tipos, interfaces
camelCase     → funciones, variables, hooks
kebab-case    → archivos de componentes (client-table.tsx)
UPPER_SNAKE   → constantes de módulo (MAX_FILE_SIZE)
```

### Archivos
```
button.tsx            → componente simple
data-table.tsx        → componente de múltiples palabras
use-pagination.ts     → hook (siempre empieza con use-)
api.ts                → módulo de utilidades
```

---

## Server Components vs Client Components

**Por defecto**: todo es Server Component en Next.js App Router.
**Marca como `'use client'`** solo cuando necesites:

| Necesito... | Uso... |
|---|---|
| useState, useEffect, useRef | 'use client' |
| Event handlers (onClick, onChange) | 'use client' |
| Browser APIs (window, document) | 'use client' |
| Radix UI / shadcn components | 'use client' |
| Solo renderizar HTML/datos | Server Component ✅ |
| fetch de datos | Server Component ✅ |
| Variables de entorno privadas | Server Component ✅ |

**Patrón recomendado**: Server Component wrapper con Client Component hijo.

```tsx
// app/clients/page.tsx — SERVER COMPONENT
import { getClients } from "@/lib/api"
import { ClientTable } from "./_components/client-table" // client

export default async function ClientsPage() {
  const clients = await getClients() // fetch en servidor
  return <ClientTable initialData={clients} />
}

// app/clients/_components/client-table.tsx — CLIENT COMPONENT
"use client"
// Recibe datos iniciales, maneja interacciones
```

---

## Manejo de errores

### En Server Components
```tsx
// app/clients/page.tsx
export default async function Page() {
  try {
    const data = await getData()
    return <View data={data} />
  } catch (error) {
    // Next.js captura esto y llama a error.tsx
    throw error
  }
}

// app/clients/error.tsx — boundary automático de Next.js
"use client"
export default function Error({ error, reset }) {
  return (
    <Alert variant="danger" title="Error al cargar clientes">
      {error.message}
      <Button onClick={reset} size="sm" className="mt-3">
        Intentar de nuevo
      </Button>
    </Alert>
  )
}

// app/clients/loading.tsx — skeleton automático
export default function Loading() {
  return <ClientTableSkeleton />
}
```

### En Client Components (Server Actions)
```tsx
const [error, setError] = useState<string | null>(null)

async function handleSubmit(data: FormData) {
  try {
    await createClient(data)
    // éxito: toast + redirect
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error inesperado")
  }
}
```

---

## Patrones de carga cognitiva — checklist de revisión

Antes de hacer PR, revisa:

- [ ] **¿El usuario sabe qué hace cada botón?** (texto descriptivo, no solo "OK")
- [ ] **¿Hay un máximo de 1 acción primaria** por sección/vista?
- [ ] **¿Los errores dicen qué hacer**, no solo qué salió mal?
- [ ] **¿El estado de carga es visible** (skeleton o spinner en el botón)?
- [ ] **¿El estado vacío ofrece una acción** para salir de él?
- [ ] **¿Los colores se usan con significado**, no decoración?
- [ ] **¿El formulario valida onBlur**, no onChange?
- [ ] **¿Los modales son de un solo propósito** (no flujos complejos)?
- [ ] **¿La tabla tiene los 4 estados**: loading, error, empty, data?
- [ ] **¿Los iconos tienen `aria-label`** o texto visible alternativo?
