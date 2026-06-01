import { toast } from "@/components/ui"
import type { SubscriptionOut } from "@/lib/types/api"

export function downloadProviderFields(subscription: SubscriptionOut) {
  try {
    const payload = {
      iccid: subscription.iccid,
      provider: subscription.provider,
      updated_at: subscription.updated_at,
      detail_level: subscription.detail_level,
      provider_fields: subscription.provider_fields,
      normalized: subscription.normalized,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${subscription.provider}-${subscription.iccid}-v2.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success("Data v2 descargada.")
  } catch {
    toast.error("No pudimos exportar la data.")
  }
}
