import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

type ErrorBoundaryState = { hasError: boolean }

/** Catches render errors anywhere below it so a single broken component can't leave a blank white page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Development aid only; production builds should not print component trees (they may include health data).
    if (import.meta.env.DEV) {
      console.error(error, info.componentStack)
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200/80 bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            This page hit an unexpected problem. Your data is safe. Reload to try again.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-9 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Reload page
            </button>
            <a
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }
}
