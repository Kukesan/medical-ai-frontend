import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/useAuth'

/** Router state passed to /auth so the user lands back where they were after signing in. */
export type AuthRedirectState = { from?: string }

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const state: AuthRedirectState = { from: `${location.pathname}${location.search}` }
    return <Navigate to="/auth" replace state={state} />
  }

  return <>{children}</>
}
