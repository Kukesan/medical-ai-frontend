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

/** Permanently deletes the account and all of its data. The backend re-checks the password. */
export function deleteMyAccount(request: AuthRequest, password: string) {
  return request<void>('/users/me', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  })
}

export function updateMyProfile(request: AuthRequest, payload: UpdateProfilePayload) {
  return request<UserProfile>('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
