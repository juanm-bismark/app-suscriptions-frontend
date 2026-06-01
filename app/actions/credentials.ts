"use server"

import {
  deactivateCompanyCredentialAction,
  deactivateCredentialAction,
  getCompanyCredentialAction,
  getCredentialAction,
  listCompanyCredentialsAction,
  listCredentialsAction,
  probeCompanyCredentialAction,
  probeStoredCredentialAction,
  testCompanyCredentialAction,
  testCredentialAction,
  upsertCompanyCredentialAction,
  upsertCredentialAction,
  type CredentialActionResult,
} from "@/lib/credentials/actions"
import type {
  CredentialMetadataOut,
  CredentialProbeOut,
  CredentialTestOut,
  CredentialUpsertIn,
} from "@/lib/types/api"

export type { CredentialActionResult }

export async function listCredentials(): Promise<CredentialActionResult<CredentialMetadataOut[]>> {
  return listCredentialsAction()
}

export async function listCompanyCredentials(
  companyId: string,
): Promise<CredentialActionResult<CredentialMetadataOut[]>> {
  return listCompanyCredentialsAction(companyId)
}

export async function getCredential(provider: string): Promise<CredentialActionResult<CredentialMetadataOut>> {
  return getCredentialAction(provider)
}

export async function getCompanyCredential(
  companyId: string,
  provider: string,
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  return getCompanyCredentialAction(companyId, provider)
}

export async function testCredential(
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialTestOut>> {
  return testCredentialAction(provider, body)
}

export async function testCompanyCredential(
  companyId: string,
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialTestOut>> {
  return testCompanyCredentialAction(companyId, provider, body)
}

export async function upsertCredential(
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  return upsertCredentialAction(provider, body)
}

export async function upsertCompanyCredential(
  companyId: string,
  provider: string,
  body: CredentialUpsertIn,
): Promise<CredentialActionResult<CredentialMetadataOut>> {
  return upsertCompanyCredentialAction(companyId, provider, body)
}

export async function probeCompanyCredential(
  companyId: string,
  provider: string,
): Promise<CredentialActionResult<CredentialProbeOut>> {
  return probeCompanyCredentialAction(companyId, provider)
}

export async function probeStoredCredential(provider: string): Promise<CredentialActionResult<{ detail: string }>> {
  return probeStoredCredentialAction(provider)
}

export async function deactivateCredential(provider: string): Promise<CredentialActionResult<Record<string, never>>> {
  return deactivateCredentialAction(provider)
}

export async function deactivateCompanyCredential(
  companyId: string,
  provider: string,
): Promise<CredentialActionResult<Record<string, never>>> {
  return deactivateCompanyCredentialAction(companyId, provider)
}

