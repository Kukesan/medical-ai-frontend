import { createContext } from 'react'
import type { AppUser } from '../types/api'
import type { AuthRequest, AuthTextRequest } from './auth-request'

export type RegisterPayload = {
  email: string
  full_name: string
  password: string
  accept_terms: boolean
}

export type AuthContextValue = {
  apiBase: string
  accessToken: string
  refreshToken: string
  isAuthenticated: boolean
  /** True after the session ended by itself (not a manual logout), so the sign-in page can explain why. */
  sessionExpired: boolean
  user: AppUser | null
  register: (payload: RegisterPayload) => Promise<AppUser>
  login: (payload: { email: string; password: string }) => Promise<AppUser>
  changePassword: (payload: { current_password: string; new_password: string }) => Promise<void>
  fetchMe: () => Promise<AppUser>
  logout: () => void
  request: AuthRequest
  requestText: AuthTextRequest
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
