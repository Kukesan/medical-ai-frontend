import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useAsyncTask } from '../hooks/useAsyncTask'
import { Alert, Button, Field, Input, inferStatusTone } from '../components/ui'
import { cn } from '../lib/cn'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const navigate = useNavigate()
  const { login, register, isAuthenticated, user } = useAuth()

  const [authMode, setAuthMode] = useState<AuthMode>('login')

  const [registerForm, setRegisterForm] = useState({
    email: '',
    full_name: '',
    password: '',
  })
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  const { status, setStatus, isLoading, run } = useAsyncTask('Welcome! Please sign in to continue.')

  const handleRegister = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      const profile = await register(registerForm)
      setStatus(`Account created for ${profile.email}. You can now log in.`)
      setAuthMode('login')
      setLoginForm({ email: registerForm.email, password: '' })
      setRegisterForm({ email: '', full_name: '', password: '' })
    })
  }

  const handleLogin = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      const profile = await login(loginForm)
      setStatus(`Welcome back, ${profile.full_name}!`)
      setTimeout(() => navigate('/dashboard'), 800)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-brand">
            <Activity className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl text-gray-900">Medical AI</h1>
          <p className="mt-2 text-sm text-gray-600">Clinical Operations Portal</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={cn(
                'flex-1 px-6 py-4 text-sm font-semibold transition-all',
                authMode === 'login'
                  ? 'border-b-2 border-primary-600 bg-white text-primary-700'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900',
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={cn(
                'flex-1 px-6 py-4 text-sm font-semibold transition-all',
                authMode === 'register'
                  ? 'border-b-2 border-primary-600 bg-white text-primary-700'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900',
              )}
            >
              Create Account
            </button>
          </div>

          <div className="p-8">
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <Field label="Email Address" htmlFor="login-email" required>
                  <Input
                    id="login-email"
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
              <form onSubmit={handleRegister} className="space-y-5">
                <Field label="Full Name" htmlFor="register-name" required>
                  <Input
                    id="register-name"
                    type="text"
                    required
                    value={registerForm.full_name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder="Dr. Jane Smith"
                  />
                </Field>
                <Field label="Email Address" htmlFor="register-email" required>
                  <Input
                    id="register-email"
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
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Create a strong password"
                  />
                </Field>
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

            {user && isAuthenticated ? (
              <Alert tone="success" className="mt-5">
                <span className="font-medium">Signed in as {user.full_name}</span>
              </Alert>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
