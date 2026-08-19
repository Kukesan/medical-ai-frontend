import type { AuthRequest } from '../context/auth-request'
import type { DoctorSearchRequest, DoctorSearchResponse } from '../types/api'

export function searchDoctors(request: AuthRequest, payload: DoctorSearchRequest) {
  return request<DoctorSearchResponse>('/doctor-recommendation/search', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
