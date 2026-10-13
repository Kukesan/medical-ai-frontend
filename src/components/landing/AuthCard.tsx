import { forwardRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { useAsyncTask } from '../../hooks/useAsyncTask'
import { Alert, Button, Field, Input, inferStatusTone } from '../ui'
import { cn } from '../../lib/cn'

export type AuthMode = 'login' | 'register'

type AuthCardProps = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  /** Where to go after signing in. */
  redirectTo: string
}

const tabs: Array<{ mode: AuthMode; label: string }> = [
  { mode: 'register', label: 'Create account' },
  { mode: 'login', label: 'Sign in' },
]

/** Sign-in / registration card. The forwarded ref points at the card so the page can scroll to it. */
export const AuthCard = forwardRef<HTMLDivElement, AuthCardProps>(function AuthCard(
  { mode, onModeChange, redirectTo },
  ref,
) {
  const navigate = useNavigate()
  const { login, register, sessionExpired } = useAuth()

  const [registerForm, setRegisterForm] = useState({
    email: '',
    full_name: '',
    password: '',
    accept_terms: false,
  })
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  const { status, setStatus, isLoading, run } = useAsyncTask('')

  const handleRegister = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      const profile = await register(registerForm)
      setStatus(`Account created for ${profile.email}. You can now sign in.`)
      onModeChange('login')
      setLoginForm({ email: registerForm.email, password: '' })
      setRegisterForm({ email: '', full_name: '', password: '', accept_terms: false })
    })
  }

  const handleLogin = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      await login(loginForm)
      navigate(redirectTo, { replace: true })
    })
  }

  return (
    <div
      ref={ref}
      id="auth-card"
      className="mx-auto w-full max-w-md scroll-mt-24 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-pop sm:p-8"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {mode === 'login' ? 'Welcome back' : 'Create your free account'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {mode === 'login'
            ? 'Sign in to see your documents, records and timeline.'
            : 'It takes about a minute. No payment details needed.'}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Account">
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            id={`auth-tab-${tab.mode}`}
            type="button"
            role="tab"
            aria-selected={mode === tab.mode}
            aria-controls="auth-panel"
            onClick={() => onModeChange(tab.mode)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
              mode === tab.mode ? 'bg-white text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode}`}>
        {sessionExpired ? (
          <Alert tone="warning" className="mb-5">
            Your session has ended. Please sign in again to continue.
          </Alert>
        ) : null}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Email Address" htmlFor="login-email" required>
              <Input
                id="login-email"
                autoComplete="email"
                type="email"
                required
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" htmlFor="login-password" required>
              <Input
                id="login-password"
                autoComplete="current-password"
                type="password"
                required
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter your password"
              />
            </Field>
            <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field label="Full Name" htmlFor="register-name" required>
              <Input
                id="register-name"
                autoComplete="name"
                type="text"
                required
                value={registerForm.full_name}
                onChange={(event) => setRegisterForm((current) => ({ ...current, full_name: event.target.value }))}
                placeholder="Jane Smith"
              />
            </Field>
            <Field label="Email Address" htmlFor="register-email" required>
              <Input
                id="register-email"
                autoComplete="email"
                type="email"
                required
                value={registerForm.email}
                onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" htmlFor="register-password" required>
              <Input
                id="register-password"
                autoComplete="new-password"
                type="password"
                required
                value={registerForm.password}
                onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Create a strong password"
                minLength={8}
                maxLength={128}
                aria-describedby="register-password-hint"
              />
              <p id="register-password-hint" className="text-xs text-gray-500">
                At least 8 characters. Use one you don't use anywhere else.
              </p>
            </Field>
            <label className="flex items-start gap-2.5 text-sm text-gray-600">
              <input
                type="checkbox"
                required
                checked={registerForm.accept_terms}
                onChange={(event) => setRegisterForm((current) => ({ ...current, accept_terms: event.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="font-medium text-primary-700 underline hover:text-primary-900">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-primary-700 underline hover:text-primary-900">
                  Privacy Policy
                </Link>
              </span>
            </label>
            <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        )}

        {status ? (
          <Alert tone={inferStatusTone(status)} className="mt-5">
            {status}
          </Alert>
        ) : null}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Your records are private to your account.
        </p>
      </div>
    </div>
  )
})
