"use server"

import {
  createCompanyAction,
  deleteCompanyAction,
  deleteMoabitsProviderMappingAction,
  discoverMoabitsProviderMappingsAction,
  getCompanyByIdAction,
  getMyMoabitsProviderMappingAction,
  listMoabitsProviderMappingsAction,
  listMoabitsSourceCompaniesAction,
  searchCompaniesAction,
  updateCompanyAction,
  upsertMoabitsProviderMappingAction,
} from "@/lib/company/actions"
import type { CompanyProviderMappingIn } from "@/lib/types/api"

export async function searchCompanies(input?: { q?: string; page?: number; size?: number; limit?: number }) {
  return searchCompaniesAction(input)
}

export async function getCompanyById(id: string) {
  return getCompanyByIdAction(id)
}

export async function createCompany(formData: FormData) {
  return createCompanyAction(formData)
}

export async function updateCompany(formData: FormData) {
  return updateCompanyAction(formData)
}

export async function deleteCompany(formData: FormData) {
  return deleteCompanyAction(formData)
}

export async function getMyMoabitsProviderMapping() {
  return getMyMoabitsProviderMappingAction()
}

export async function discoverMoabitsProviderMappings() {
  return discoverMoabitsProviderMappingsAction()
}

export async function listMoabitsSourceCompanies(input?: {
  q?: string
  page?: number
  size?: number
  activeOnly?: boolean
}) {
  return listMoabitsSourceCompaniesAction(input)
}

export async function listMoabitsProviderMappings(input?: {
  q?: string
  page?: number
  size?: number
  linkedOnly?: boolean
}) {
  return listMoabitsProviderMappingsAction(input)
}

export async function upsertMoabitsProviderMapping(companyId: string, body: CompanyProviderMappingIn) {
  return upsertMoabitsProviderMappingAction(companyId, body)
}

export async function deleteMoabitsProviderMapping(companyId: string) {
  return deleteMoabitsProviderMappingAction(companyId)
}

