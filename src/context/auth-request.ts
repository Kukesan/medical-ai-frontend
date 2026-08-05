import type { AuthTokens, ApiErrorPayload } from '../types/api'
import { ApiRequestError } from '../lib/ApiRequestError'

export type AuthRequest = <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T>

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload
    return payload.error?.message ?? `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}

type CreateAuthRequestOptions = {
  apiBase: string
  getAccessToken: () => string
  refreshTokens: () => Promise<AuthTokens | null>
  logout: () => void
}

export function createAuthRequest({ apiBase, getAccessToken, refreshTokens, logout }: CreateAuthRequestOptions) {
  return async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
    const runFetch = async (token?: string) => {
      const headers = new Headers(init.headers)
      const isFormData = init.body instanceof FormData

      if (!isFormData && init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      if (auth && token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      return fetch(`${apiBase}${path}`, {
        ...init,
        headers,
      })
    }

    let response = await runFetch(getAccessToken())
    if (response.status === 401 && auth) {
      const refreshed = await refreshTokens()
      if (refreshed) {
        response = await runFetch(refreshed.access_token)
      } else {
        logout()
      }
    }

    if (!response.ok) {
      throw new ApiRequestError(response.status, await readErrorMessage(response))
    }

    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return undefined as T
    }

    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }
}