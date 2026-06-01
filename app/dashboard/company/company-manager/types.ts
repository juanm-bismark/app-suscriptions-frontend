import type { Company } from "@/lib/types/user"

export type CompanyManagerProps = {
  initialCompanies: Company[]
  initialTotal: number | null
  initialPage: number
  initialSize: number
  initialPages: number | null
  initialQuery: string
  initialError?: string | null
}
