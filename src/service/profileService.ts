import type { AuthRequest } from '../context/auth-request'
import type { UserProfile } from '../types/api'

export function getMyProfile(request: AuthRequest) {
  return request<UserProfile>('/users/me/profile')
}

export type UpdateProfilePayload = {
  full_name: string
  date_of_birth?: string
  bio?: string
  notes?: string
}

export function updateMyProfile(request: AuthRequest, payload: UpdateProfilePayload) {
  return request<UserProfile>('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
