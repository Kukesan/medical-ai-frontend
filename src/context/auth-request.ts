import type { AuthTokens, ApiErrorPayload } from '../types/api'
import { ApiRequestError } from '../lib/ApiRequestError'

export type AuthRequest = <T>(path: string, init?: RequestInit, auth?: boolean) => Promise<T>
export type AuthTextRequest = (path: string, init?: RequestInit, auth?: boolean) => Promise<string>

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload

    if (payload.error?.message) {
      return payload.error.message
    }

    if (typeof payload.detail === 'string') {
      return payload.detail
    }

    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      return payload.detail
        .map((item) => {
          const field = item.loc?.at(-1)
          return field ? `${field}: ${item.msg}` : item.msg
        })
        .join('; ')
    }

    return `Request failed with status ${response.status}`
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

function createFetchWithAuth({ apiBase, getAccessToken, refreshTokens, logout }: CreateAuthRequestOptions) {
  return async function fetchWithAuth(path: string, init: RequestInit = {}, auth = true): Promise<Response> {
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

    const sentToken = getAccessToken()
    let response = await runFetch(sentToken)
    if (response.status === 401 && auth) {
      const currentToken = getAccessToken()
      if (currentToken && currentToken !== sentToken) {
        // Another request already refreshed while this one was in flight: just retry with the new token.
        response = await runFetch(currentToken)
      } else {
        const refreshed = await refreshTokens()
        if (refreshed) {
          response = await runFetch(refreshed.access_token)
        } else {
          logout()
        }
      }
    }

    if (!response.ok) {
      throw new ApiRequestError(response.status, await readErrorMessage(response))
    }

    return response
  }
}

export function createAuthRequest(options: CreateAuthRequestOptions) {
  const fetchWithAuth = createFetchWithAuth(options)

  return async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
    const response = await fetchWithAuth(path, init, auth)

    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return undefined as T
    }

    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }
}

export function createAuthTextRequest(options: CreateAuthRequestOptions): AuthTextRequest {
  const fetchWithAuth = createFetchWithAuth(options)

  return async function requestText(path: string, init: RequestInit = {}, auth = true): Promise<string> {
    const response = await fetchWithAuth(path, init, auth)
    return response.text()
  }
}