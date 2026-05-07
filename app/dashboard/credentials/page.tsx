import Link from "next/link"
import { listCredentials } from "@/app/actions/credentials"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import type { CredentialMetadataOut } from "@/lib/types/api"
import { SourceBadge } from "@/app/dashboard/subscriptions/primitives"
import { Alert, AlertDescription, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { EXPIRY_META, PROVIDERS, formatDate, scopeValue } from "./credential-utils"

function CredentialExpiryBadge({ status }: { status: CredentialMetadataOut["expiry_status"] }) {
  const item = EXPIRY_META[status] ?? EXPIRY_META.invalid

  return (
    <Badge
      variant="outline"
      style={{
        background: item.meta.bg,
        color: item.meta.color,
        border: `1px solid ${item.meta.dot}33`,
      }}
    >
      {item.label}
    </Badge>
  )
}

export default async function CredentialsPage() {
  await requireManagerOrAdmin()
  const result = await listCredentials()
  const credentials = result.ok ? result.data : []
  const byProvider = new Map(credentials.map((credential) => [credential.provider, credential]))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-title">Credenciales</h1>
        <p className="text-muted">Administra los accesos de proveedor usados para sincronizar y operar SIMs.</p>
      </div>

      {!result.ok && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-page">
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Rotacion</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {PROVIDERS.map((provider) => {
                const credential = byProvider.get(provider)
                const href = `/dashboard/credentials/${provider}`

                return (
                  <TableRow key={provider}>
                    <TableCell className="font-medium text-title">
                      <SourceBadge source={provider} withName />
                    </TableCell>
                    <TableCell>
                      {credential?.active ? (
                        <Badge variant="success">
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Sin configurar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {credential ? <CredentialExpiryBadge status={credential.expiry_status} /> : "No aplica"}
                    </TableCell>
                    <TableCell className="text-muted">
                      {credential
                        ? provider === "tele2"
                          ? scopeValue(credential.account_scope, "account_id")
                          : scopeValue(credential.account_scope, "environment")
                        : "No definido"}
                    </TableCell>
                    <TableCell className="text-muted">{formatDate(credential?.rotated_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-3">
                        {credential?.active ? (
                          <Link className="text-sm font-medium text-header-bg hover:underline" href={href}>
                            Probar
                          </Link>
                        ) : null}
                        <Link className="text-sm font-medium text-header-bg hover:underline" href={href}>
                          {credential?.active ? "Editar" : "Configurar"}
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
