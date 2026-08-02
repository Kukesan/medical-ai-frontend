import type { AppUser, AuthTokens } from '../types/api'
import type { AuthRequest } from '../context/auth-request'

export function registerUser(
  request: AuthRequest,
  payload: { email: string; full_name: string; password: string },
) {
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