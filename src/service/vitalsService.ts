import type { AuthRequest } from '../context/auth-request'
import type { VitalsEntry } from '../types/api'

export function listVitals(request: AuthRequest) {
  return request<VitalsEntry[]>('/vitals')
}

export type CreateVitalsPayload = {
  recorded_at: string
  height?: number
  weight?: number
  blood_group?: string
  pressure?: string
  blood_sugar?: number
}

export function createVitals(request: AuthRequest, payload: CreateVitalsPayload) {
  return request<VitalsEntry>('/vitals', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteVitals(request: AuthRequest, vitalsId: string) {
  return request<void>(`/vitals/${vitalsId}`, {
    method: 'DELETE',
  })
}
