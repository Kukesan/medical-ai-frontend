import type { AuthRequest } from '../context/auth-request'
import type { MedicalRecordListItem, RecordIntakeResponse } from '../types/api'

export function startRecordIntake(request: AuthRequest, text: string) {
  return request<RecordIntakeResponse>('/record-intake', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function getRecordIntake(request: AuthRequest, intakeId: string) {
  return request<RecordIntakeResponse>(`/record-intake/${intakeId}`)
}

export function answerRecordIntake(request: AuthRequest, intakeId: string, answer: string) {
  return request<RecordIntakeResponse>(`/record-intake/${intakeId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  })
}

export function confirmRecordIntake(request: AuthRequest, intakeId: string, overrides?: Record<string, unknown>) {
  const body = overrides && Object.keys(overrides).length > 0 ? { data: overrides } : {}
  return request<MedicalRecordListItem>(`/record-intake/${intakeId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function abandonRecordIntake(request: AuthRequest, intakeId: string) {
  return request<RecordIntakeResponse>(`/record-intake/${intakeId}/abandon`, {
    method: 'POST',
  })
}
