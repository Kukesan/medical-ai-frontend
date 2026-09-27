import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useAsyncTask } from '../hooks/useAsyncTask'
import { Alert, Button, Field, Input, inferStatusTone } from '../components/ui'
import { cn } from '../lib/cn'

type AuthMode = 'login' | 'register'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: FileText,
    title: 'Upload Documents',
    description: 'Upload prescriptions, lab reports and discharge notes. Key details are extracted for you to review.',
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Check for medication interactions and surface important findings, ranked by risk.',
  },
  {
    icon: Clock,
    title: 'Health Timeline',
    description: 'See your medical history in one chronological view, from visits to diagnoses.',
  },
  {
    icon: MessageCircle,
    title: 'Ask Questions',
    description: 'Chat with an assistant grounded in your own documents and analysis results.',
  },
  {
    icon: ClipboardList,
    title: 'Medical Records',
    description: 'Keep allergies, vaccinations, surgeries and more organized, verified and up to date.',
  },
  {
    icon: HeartPulse,
    title: 'Track Vitals',
    description: 'Log height, weight, blood pressure and blood sugar to follow trends over time.',
  },
]

const steps = [
  { title: 'Create your account', description: 'Sign up in under a minute. Your records stay private to you.' },
  { title: 'Add your records', description: 'Upload documents or describe a medical event in your own words.' },
  { title: 'Get clear insights', description: 'Review extracted data, run analysis and ask questions anytime.' },
]

const highlights = ['Structured records from your documents', 'Medication interaction checks', 'Answers grounded in your data']

function Brand({ inverted }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg',
          inverted ? 'bg-white/10 ring-1 ring-inset ring-white/15' : 'bg-primary-600',
        )}
      >
        <Activity className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
      </div>
      <span className={cn('text-xs font-bold uppercase tracking-wider', inverted ? 'text-white' : 'text-primary-600')}>
        Medical AI
      </span>
    </div>
  )
}

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

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-primary-900/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Brand inverted />
          <nav className="flex items-center gap-2">
            <a
              href="#features"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-block"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-block"
            >
              How it works
            </a>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="h-9 rounded-lg bg-white px-4 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50"
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero + auth */}
      <section className="bg-primary-900">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-100 ring-1 ring-inset ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-300" />
              Clinical Operations Portal
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Your medical history, organized and understood.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              Bring every document, record and vital into one place. Medical AI turns them into structured data and
              clear insights you can act on.
            </p>
            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/85">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div id="auth-card" className="w-full scroll-mt-24 lg:justify-self-end">
            <div className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-pop sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {authMode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {authMode === 'login'
                    ? 'Sign in to access your health dashboard.'
                    : 'Start organizing your medical records today.'}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === 'login'}
                  onClick={() => setAuthMode('login')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                    authMode === 'login' ? 'bg-white text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === 'register'}
                  onClick={() => setAuthMode('register')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                    authMode === 'register' ? 'bg-white text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  Create Account
                </button>
              </div>

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
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
                <form onSubmit={handleRegister} className="space-y-4">
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
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary-600">Features</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Everything you need to manage your health records
            </h2>
            <p className="mt-3 text-base text-gray-500">
              From raw documents to clear answers, all in one secure workspace.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-t border-gray-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary-600">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Get started in three steps</h2>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-gray-500">{step.description}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => openAuth('register')}>
              Create a free account
            </Button>
            <Button size="lg" variant="secondary" onClick={() => openAuth('login')}>
              I already have an account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
          <Brand inverted />
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Medical AI. Not a substitute for professional medical advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
