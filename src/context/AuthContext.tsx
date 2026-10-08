import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppUser, AuthTokens } from '../types/api'
import { AuthContext } from './auth-context'
import type { RegisterPayload } from './auth-context'
import { buildApiBase, clearStoredSession, persistStoredAuth, readStoredAuth } from './auth-storage'
import { createAuthRequest, createAuthTextRequest } from './auth-request'
import { changeUserPassword, fetchCurrentUser, loginUser, registerUser } from '../service/authService'

const apiBase = buildApiBase()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => readStoredAuth().tokens)
  const [user, setUser] = useState<AppUser | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Requests read tokens through a ref so in-flight calls always see the latest pair,
  // and so `request` stays stable instead of changing (and re-triggering page loads) on every refresh.
  const tokensRef = useRef(tokens)
  const refreshPromiseRef = useRef<Promise<AuthTokens | null> | null>(null)

  const accessToken = tokens?.access_token ?? ''
  const refreshToken = tokens?.refresh_token ?? ''
  const isAuthenticated = Boolean(accessToken)

  const writeTokens = useCallback((nextTokens: AuthTokens | null) => {
    tokensRef.current = nextTokens
    setTokens(nextTokens)
    if (nextTokens) {
      persistStoredAuth(nextTokens)
    } else {
      clearStoredSession()
    }
  }, [])

  const clearSession = useCallback(() => {
    refreshPromiseRef.current = null
    writeTokens(null)
    setUser(null)
  }, [writeTokens])

  /** The session ended on its own (refresh rejected): sign out and tell the user why. */
  const expireSession = useCallback(() => {
    if (tokensRef.current) {
      setSessionExpired(true)
    }
    clearSession()
  }, [clearSession])

  /** User-initiated sign out: revoke the tokens server-side too, so a copied token stops working. */
  const logout = useCallback(() => {
    const currentAccessToken = tokensRef.current?.access_token
    if (currentAccessToken) {
      // Best effort: the local session is cleared regardless of the outcome.
      void fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentAccessToken}` },
        keepalive: true,
      }).catch(() => undefined)
    }
    setSessionExpired(false)
    clearSession()
  }, [clearSession])

  // Single-flight: parallel requests that hit 401 together share one refresh call. Sending the same
  // refresh token twice would make the second call fail once the backend rotates refresh tokens.
  const refreshTokens = useCallback((): Promise<AuthTokens | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const currentRefreshToken = tokensRef.current?.refresh_token
    if (!currentRefreshToken) {
      return Promise.resolve(null)
    }

    const pending = (async () => {
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
      })

      if (!response.ok) {
        expireSession()
        return null
      }

      const refreshed = (await response.json()) as AuthTokens
      writeTokens(refreshed)
      return refreshed
    })().finally(() => {
      refreshPromiseRef.current = null
    })

    refreshPromiseRef.current = pending
    return pending
  }, [expireSession, writeTokens])

  const request = useMemo(
    () =>
      createAuthRequest({
        apiBase,
        getAccessToken: () => tokensRef.current?.access_token ?? '',
        refreshTokens,
        logout: expireSession,
      }),
    [expireSession, refreshTokens],
  )

  const requestText = useMemo(
    () =>
      createAuthTextRequest({
        apiBase,
        getAccessToken: () => tokensRef.current?.access_token ?? '',
        refreshTokens,
        logout: expireSession,
      }),
    [expireSession, refreshTokens],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      return registerUser(request, payload)
    },
    [request],
  )

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const tokenPayload = await loginUser(request, payload)
      // Start from a clean slate so nothing from a previous user in this tab carries over.
      clearStoredSession()
      setSessionExpired(false)
      writeTokens(tokenPayload)

      try {
        const profile = await fetchCurrentUser(request, tokenPayload.access_token)
        setUser(profile)
        return profile
      } catch (error) {
        // Don't leave the user half signed in behind an error message.
        clearSession()
        throw error
      }
    },
    [clearSession, request, writeTokens],
  )

  const changePassword = useCallback(
    async (payload: { current_password: string; new_password: string }) => {
      // The backend revokes every existing token and returns a fresh pair for this device.
      const nextTokens = await changeUserPassword(request, payload)
      writeTokens(nextTokens)
    },
    [request, writeTokens],
  )

  const fetchMe = useCallback(async () => {
    const profile = await fetchCurrentUser(request, tokensRef.current?.access_token ?? '')
    setUser(profile)
    return profile
  }, [request])

  // After a page reload the tokens survive in sessionStorage but the profile doesn't; load it once.
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchMe().catch(() => undefined)
    }
  }, [fetchMe, isAuthenticated, user])

  const contextValue = useMemo(
    () => ({
      apiBase,
      accessToken,
      refreshToken,
      isAuthenticated,
      sessionExpired,
      user,
      register,
      login,
      changePassword,
      fetchMe,
      logout,
      request,
      requestText,
    }),
    [
      accessToken,
      changePassword,
      fetchMe,
      isAuthenticated,
      login,
      logout,
      refreshToken,
      register,
      request,
      requestText,
      sessionExpired,
      user,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
