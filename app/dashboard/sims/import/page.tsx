import { listActiveCredentialProviders } from "@/app/actions/providers"
import { requireManagerOrAdmin } from "@/lib/auth/current-user"
import { SimImportForm } from "./sim-import-form"

export const metadata = {
  title: "Importar SIMs · Bismark",
}

export default async function SimImportPage() {
  await requireManagerOrAdmin()
  const activeProviders = await listActiveCredentialProviders()

  return <SimImportForm activeProviders={activeProviders ?? []} />
}
