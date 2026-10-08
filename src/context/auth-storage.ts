import type { AuthTokens } from '../types/api'

export const AUTH_STORAGE_KEY = 'medical_ai_auth_v1'
/** Every per-user key this app keeps in sessionStorage starts with this prefix, so logout can clear them all. */
const SESSION_KEY_PREFIX = 'medical_ai_'

type StoredAuth = {
  tokens: AuthTokens | null
}

// sessionStorage is absent while pages are pre-rendered at build time.
const hasSessionStorage = () => typeof sessionStorage !== 'undefined'

export function readStoredAuth(): StoredAuth {
  const raw = hasSessionStorage() ? sessionStorage.getItem(AUTH_STORAGE_KEY) : null
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

export function persistStoredAuth(tokens: AuthTokens | null) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ tokens }))
}

/** Removes tokens and any other per-user state (e.g. the open chat session) so the next user starts clean. */
export function clearStoredSession() {
  if (!hasSessionStorage()) {
    return
  }
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(SESSION_KEY_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key))
}

/** API base URL, fixed at build time. Never read from storage, so tokens can only ever go to this origin. */
export function buildApiBase(): string {
  const cleanOrigin = (import.meta.env.VITE_API_ORIGIN ?? '').trim().replace(/\/$/, '')
  return `${cleanOrigin}/api/v1`
}
