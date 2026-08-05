import type { AuthRequest } from '../context/auth-request'
import type { SurgeryItem } from '../types/api'

export function listSurgeries(request: AuthRequest) {
  return request<SurgeryItem[]>('/surgery/list')
}

export type CreateSurgeryPayload = {
  name: string
  date: string
  notes: string
}

export function createSurgery(request: AuthRequest, payload: CreateSurgeryPayload) {
  return request<SurgeryItem>('/surgery/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteSurgery(request: AuthRequest, surgeryId: string) {
  return request<void>(`/surgery/${surgeryId}`, {
    method: 'DELETE',
  })
}
