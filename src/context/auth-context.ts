import { createContext } from 'react'
import type { AppUser } from '../types/api'
import type { AuthRequest } from './auth-request'

export type AuthContextValue = {
  apiOrigin: string
  apiBase: string
  accessToken: string
  refreshToken: string
  isAuthenticated: boolean
  user: AppUser | null
  setApiOrigin: (origin: string) => void
  register: (payload: { email: string; full_name: string; password: string }) => Promise<AppUser>
  login: (payload: { email: string; password: string }) => Promise<AppUser>
  fetchMe: () => Promise<AppUser>
  logout: () => void
  request: AuthRequest
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
