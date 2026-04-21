# Setup de Autenticación

Frontend con NextAuth + Email/Contraseña + PostgreSQL.

## 1. Configurar PostgreSQL

### Opción A: Docker (recomendado)
```bash
docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=app_suscripciones \
  -p 5432:5432 \
  -d postgres
```

### Opción B: Local
Instala PostgreSQL e crea una base de datos llamada `app_suscripciones`.

### Opción C: Cloud
- Supabase: https://supabase.com
- Vercel Postgres: https://vercel.com/postgres
- Railway: https://railway.app

## 2. Completar .env.local

Abre `.env.local` y reemplaza:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/app_suscripciones"
AUTH_SECRET="tu-secret-aqui"
```

**Para generar AUTH_SECRET:**
```bash
npx auth secret
```

Esto genera una cadena larga. Cópiala y pégala en `AUTH_SECRET=`.

## 3. Crear la base de datos

Ejecuta las migraciones de Prisma:
```bash
npx prisma migrate dev --name init
```

Esto crea la tabla `User`.

## 4. Probar

```bash
npm run dev
```

Abre http://localhost:3000/register y crea un usuario.

## Archivos creados

- **auth.ts** — Configuración de NextAuth con Credentials provider
- **prisma/schema.prisma** — Modelo de base de datos
- **app/api/auth/[...nextauth]/route.ts** — Route handler para NextAuth
- **app/login/page.tsx** — Página de login
- **app/register/page.tsx** — Página de registro
- **app/dashboard/page.tsx** — Página protegida (requiere login)
- **app/actions/auth.ts** — Server action para registrar usuarios
- **app/components/** — Botones de sign-in/sign-out

## Rutas disponibles

- `/login` — Login
- `/register` — Registro
- `/dashboard` — Protegida (requiere autenticación)
- `/api/auth/*` — NextAuth endpoints

## Personalización

### Cambiar email del provider
Edita `auth.ts` en la sección `authorize()`.

### Agregar más campos a User
1. Edita `prisma/schema.prisma`
2. Ejecuta `npx prisma migrate dev --name add_field`

### Redirigir después del login
En `app/login/page.tsx`, cambia:
```typescript
router.push("/dashboard")  // Cambia esto
```

## Troubleshooting

**Error: "Database connection failed"**
- Verifica DATABASE_URL en .env.local
- Verifica que PostgreSQL esté corriendo

**Error: "AUTH_SECRET is not set"**
- Ejecuta `npx auth secret`
- Copia el output a .env.local

**Error: "Table User does not exist"**
- Ejecuta `npx prisma migrate dev --name init`
