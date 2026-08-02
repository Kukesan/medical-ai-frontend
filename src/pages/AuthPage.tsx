import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useAsyncTask } from '../hooks/useAsyncTask'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const navigate = useNavigate()
  const { apiOrigin, setApiOrigin, login, register, isAuthenticated, user } = useAuth()

  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showApiSetup, setShowApiSetup] = useState(false)
  
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
      setStatus(`✓ Account created for ${profile.email}. You can now log in.`)
      setAuthMode('login')
      setLoginForm({ email: registerForm.email, password: '' })
      setRegisterForm({ email: '', full_name: '', password: '' })
    })
  }

  const handleLogin = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      const profile = await login(loginForm)
      setStatus(`✓ Welcome back, ${profile.full_name}!`)
      setTimeout(() => navigate('/workflow'), 800)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#AA1C41] to-[#D62551] shadow-lg shadow-[#AA1C41]/20">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="font-['Archivo_Black'] text-2xl text-gray-900">Yarlit Medical AI</h1>
          <p className="mt-2 text-sm text-gray-600">Clinical Operations Portal</p>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                authMode === 'login'
                  ? 'border-b-2 border-[#AA1C41] bg-white text-[#AA1C41]'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                authMode === 'register'
                  ? 'border-b-2 border-[#AA1C41] bg-white text-[#AA1C41]'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-8">
            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:border-[#AA1C41] focus:outline-none focus:ring-4 focus:ring-[#AA1C41]/10"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:border-[#AA1C41] focus:outline-none focus:ring-4 focus:ring-[#AA1C41]/10"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-[#AA1C41] to-[#D62551] px-4 py-3 font-semibold text-white shadow-lg shadow-[#AA1C41]/25 transition hover:shadow-xl hover:shadow-[#AA1C41]/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Register Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label htmlFor="register-name" className="mb-2 block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:border-[#AA1C41] focus:outline-none focus:ring-4 focus:ring-[#AA1C41]/10"
                    value={registerForm.full_name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, full_name: event.target.value }))
                    }
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:border-[#AA1C41] focus:outline-none focus:ring-4 focus:ring-[#AA1C41]/10"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition placeholder:text-gray-400 focus:border-[#AA1C41] focus:outline-none focus:ring-4 focus:ring-[#AA1C41]/10"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Create a strong password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-[#AA1C41] to-[#D62551] px-4 py-3 font-semibold text-white shadow-lg shadow-[#AA1C41]/25 transition hover:shadow-xl hover:shadow-[#AA1C41]/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Status Message */}
            {status && (
              <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
                status.includes('✓') 
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : status.toLowerCase().includes('error') || status.toLowerCase().includes('fail')
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}>
                {status}
              </div>
            )}

            {/* Current User Info */}
            {user && isAuthenticated && (
              <div className="mt-5 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-800">Signed in as {user.full_name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
