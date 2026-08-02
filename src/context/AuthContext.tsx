import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppUser, AuthTokens } from '../types/api'
import { AuthContext } from './auth-context'
import { buildApiBase, persistStoredAuth, persistStoredOrigin, readStoredAuth, readStoredOrigin } from './auth-storage'
import { createAuthRequest } from './auth-request'
import { fetchCurrentUser, loginUser, registerUser } from '../service/authService'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => readStoredAuth().tokens)
  const [apiOrigin, setApiOriginState] = useState<string>(() => readStoredOrigin())
  const [user, setUser] = useState<AppUser | null>(null)

  const accessToken = tokens?.access_token ?? ''
  const refreshToken = tokens?.refresh_token ?? ''
  const isAuthenticated = Boolean(accessToken)

  const apiBase = useMemo(() => buildApiBase(apiOrigin), [apiOrigin])

  const setApiOrigin = useCallback((origin: string) => {
    setApiOriginState(origin)
    persistStoredOrigin(origin)
  }, [])

  const writeTokens = useCallback((nextTokens: AuthTokens | null) => {
    setTokens(nextTokens)
    persistStoredAuth(nextTokens)
  }, [])

  const logout = useCallback(() => {
    writeTokens(null)
    setUser(null)
  }, [writeTokens])

  const refreshTokens = useCallback(async (): Promise<AuthTokens | null> => {
    if (!refreshToken) {
      return null
    }

    const response = await fetch(`${apiBase}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      logout()
      return null
    }

    const refreshed = (await response.json()) as AuthTokens
    writeTokens(refreshed)
    return refreshed
  }, [apiBase, logout, refreshToken, writeTokens])

  const request = useMemo(
    () =>
      createAuthRequest({
        apiBase,
        getAccessToken: () => accessToken,
        refreshTokens,
        logout,
      }),
    [accessToken, apiBase, logout, refreshTokens],
  )

  const register = useCallback(
    async (payload: { email: string; full_name: string; password: string }) => {
      return registerUser(request, payload)
    },
    [request],
  )

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const tokenPayload = await loginUser(request, payload)
      writeTokens(tokenPayload)

      const profile = await fetchCurrentUser(request, tokenPayload.access_token)
      setUser(profile)
      return profile
    },
    [request, writeTokens],
  )

  const fetchMe = useCallback(async () => {
    const effectiveToken = accessToken || readStoredAuth().tokens?.access_token || ''
    const profile = await fetchCurrentUser(request, effectiveToken)
    setUser(profile)
    return profile
  }, [accessToken, request])

  const contextValue = useMemo(
    () => ({
      apiOrigin,
      apiBase,
      accessToken,
      refreshToken,
      isAuthenticated,
      user,
      setApiOrigin,
      register,
      login,
      fetchMe,
      logout,
      request,
    }),
    [
      accessToken,
      apiBase,
      apiOrigin,
      fetchMe,
      isAuthenticated,
      login,
      logout,
      refreshToken,
      register,
      request,
      setApiOrigin,
      user,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
