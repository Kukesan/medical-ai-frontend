import type { AuthTokens } from '../types/api'

export const AUTH_STORAGE_KEY = 'medical_ai_auth_v1'
export const API_ORIGIN_STORAGE_KEY = 'medical_ai_origin_v1'

type StoredAuth = {
  tokens: AuthTokens | null
}

export function readStoredAuth(): StoredAuth {
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return { tokens: null }
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuth
    return {
      tokens: parsed.tokens ?? null,
    }
  } catch {
    return { tokens: null }
  }
}

export function readStoredOrigin(): string {
  return sessionStorage.getItem(API_ORIGIN_STORAGE_KEY) ?? import.meta.env.VITE_API_ORIGIN ?? ''
}

export function persistStoredAuth(tokens: AuthTokens | null) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ tokens }))
}

export function persistStoredOrigin(origin: string) {
  sessionStorage.setItem(API_ORIGIN_STORAGE_KEY, origin)
}

export function buildApiBase(apiOrigin: string): string {
  const cleanOrigin = apiOrigin.trim().replace(/\/$/, '')
  return `${cleanOrigin}/api/v1`
}