import type { AuthRequest } from '../context/auth-request'
import type { AllergyItem } from '../types/api'

export function listAllergies(request: AuthRequest) {
  return request<AllergyItem[]>('/allergy/list')
}

export type CreateAllergyPayload = {
  substance: string
  severity: string
  reaction: string
}

export function createAllergy(request: AuthRequest, payload: CreateAllergyPayload) {
  return request<AllergyItem>('/allergy/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteAllergy(request: AuthRequest, allergyId: string) {
  return request<void>(`/allergy/${allergyId}`, {
    method: 'DELETE',
  })
}
