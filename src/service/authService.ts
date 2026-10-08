import type { AppUser, AuthTokens } from '../types/api'
import type { AuthRequest } from '../context/auth-request'
import type { RegisterPayload } from '../context/auth-context'

export function registerUser(request: AuthRequest, payload: RegisterPayload) {
  return request<AppUser>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false,
  )
}

export function loginUser(request: AuthRequest, payload: { email: string; password: string }) {
  return request<AuthTokens>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false,
  )
}

export function fetchCurrentUser(request: AuthRequest, accessToken: string) {
  return request<AppUser>('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export function changeUserPassword(
  request: AuthRequest,
  payload: { current_password: string; new_password: string },
) {
  return request<AuthTokens>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
