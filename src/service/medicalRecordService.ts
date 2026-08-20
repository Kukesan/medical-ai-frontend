import type { AuthRequest } from '../context/auth-request'
import type {
  GroupedMedicalRecords,
  MedicalRecord,
  MedicalRecordStatus,
  MedicalRecordType,
  RecordTypeDefinition,
} from '../types/api'

export type ListMedicalRecordsParams = {
  recordType?: MedicalRecordType | string
  status?: MedicalRecordStatus
  limit?: number
  offset?: number
}

export function getGroupedMedicalRecords(request: AuthRequest, status?: MedicalRecordStatus) {
  const query = new URLSearchParams()
  if (status) query.set('status', status)

  const queryString = query.toString()
  return request<GroupedMedicalRecords[]>(`/medical-records/grouped${queryString ? `?${queryString}` : ''}`)
}

export function listMedicalRecords(request: AuthRequest, params: ListMedicalRecordsParams = {}) {
  const query = new URLSearchParams()
  if (params.recordType) query.set('record_type', params.recordType)
  if (params.status) query.set('status', params.status)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))

  const queryString = query.toString()
  return request<MedicalRecord[]>(`/medical-records${queryString ? `?${queryString}` : ''}`)
}

export function getMedicalRecord(request: AuthRequest, recordId: string) {
  return request<MedicalRecord>(`/medical-records/${recordId}`)
}

export function updateMedicalRecord(request: AuthRequest, recordId: string, data: Record<string, unknown>) {
  return request<MedicalRecord>(`/medical-records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ data }),
  })
}

export function verifyMedicalRecord(request: AuthRequest, recordId: string) {
  return request<MedicalRecord>(`/medical-records/${recordId}/verify`, {
    method: 'POST',
  })
}

export function rejectMedicalRecord(request: AuthRequest, recordId: string) {
  return request<MedicalRecord>(`/medical-records/${recordId}/reject`, {
    method: 'POST',
  })
}

export function deleteMedicalRecord(request: AuthRequest, recordId: string) {
  return request<void>(`/medical-records/${recordId}`, {
    method: 'DELETE',
  })
}

export type ConflictResolution = 'keep_existing' | 'accept_incoming'

export function resolveMedicalRecordConflict(
  request: AuthRequest,
  recordId: string,
  resolution: ConflictResolution,
) {
  return request<MedicalRecord>(`/medical-records/${recordId}/resolve-conflict`, {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  })
}

export function listRecordTypes(request: AuthRequest) {
  return request<RecordTypeDefinition[]>('/record-types')
}

export function getRecordType(request: AuthRequest, code: string) {
  return request<RecordTypeDefinition>(`/record-types/${code}`)
}
