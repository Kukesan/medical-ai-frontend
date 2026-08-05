import type { AuthRequest } from '../context/auth-request'
import type { VaccinationItem } from '../types/api'

export function listVaccinations(request: AuthRequest) {
  return request<VaccinationItem[]>('/vaccination/list')
}

export type CreateVaccinationPayload = {
  name: string
  date_administered: string
  is_next_due: boolean
  next_due_date: string | null
}

export function createVaccination(request: AuthRequest, payload: CreateVaccinationPayload) {
  return request<VaccinationItem>('/vaccination/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteVaccination(request: AuthRequest, vaccinationId: string) {
  return request<void>(`/vaccination/${vaccinationId}`, {
    method: 'DELETE',
  })
}
