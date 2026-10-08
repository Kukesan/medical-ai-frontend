import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
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
import { PublicFooter, PublicHeader } from '../components/PublicLayout'
import { JsonLd } from '../components/JsonLd'
import { absoluteUrl, PUBLIC_PAGES } from '../lib/publicPages'
import { usePublicPageMeta } from '../lib/seo'
import type { AuthRedirectState } from '../components/ProtectedRoute'

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

type Faq = {
  question: string
  /** Plain-text answer, used verbatim in the FAQPage structured data. */
  answer: string
  link?: { to: string; label: string }
}

const faqs: Faq[] = [
  {
    question: 'Is Envagai a substitute for my doctor?',
    answer:
      'No. Envagai helps you organize and understand your own records, but it does not diagnose or recommend treatment. Always consult a qualified healthcare professional, and contact your local emergency services in an emergency.',
    link: { to: '/terms', label: 'Read the Terms of Use' },
  },
  {
    question: 'What documents can I add?',
    answer:
      'You can upload prescriptions, lab reports, discharge notes and similar documents as PDF, PNG or JPEG files. You can also describe a medical event in your own words.',
  },
  {
    question: 'How does Envagai read my documents?',
    answer:
      'An AI model extracts key details such as medications, diagnoses and test results. You can review and correct the extracted details, because AI can make mistakes.',
  },
  {
    question: 'How does the medication interaction check work?',
    answer:
      'Envagai analyzes the medications in your records for possible interactions and ranks the findings by risk. Results may be incomplete, so confirm them with your doctor or pharmacist.',
  },
  {
    question: 'Who can see my records?',
    answer:
      'Your records are only available after signing in to your account. Your data is not sold or used for advertising. Service providers that help run Envagai, such as the AI provider, process it on our behalf.',
    link: { to: '/privacy', label: 'Read the Privacy Policy' },
  },
  {
    question: 'Can I delete my data?',
    answer:
      'Yes. You can delete individual documents, medical records and vitals entries at any time, or permanently delete your whole account and all of its data from your Profile page.',
  },
]

const highlights = ['Structured records from your documents', 'Medication interaction checks', 'Answers grounded in your data']

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  usePublicPageMeta(location.pathname)

  // Router links like "/#features" don't scroll by themselves.
  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    }
  }, [location.hash])
  const { login, register, isAuthenticated, sessionExpired } = useAuth()
  // Where to go after signing in: the protected page that sent the user here, else the dashboard.
  const redirectTo = (location.state as AuthRedirectState | null)?.from ?? '/dashboard'

  const [authMode, setAuthMode] = useState<AuthMode>('login')

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
  const { status, setStatus, isLoading, run } = useAsyncTask('Welcome! Please sign in to continue.')

  const handleRegister = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      const profile = await register(registerForm)
      setStatus(`Account created for ${profile.email}. You can now log in.`)
      setAuthMode('login')
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

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader>
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
          className="h-9 rounded-lg bg-accent-400 px-4 text-sm font-semibold text-primary-900 transition-colors hover:bg-accent-300"
        >
          Get Started
        </button>
      </PublicHeader>

      <main>
        {/* Hero + auth */}
        <section className="bg-primary-900" aria-labelledby="hero-heading">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-100 ring-1 ring-inset ring-white/15">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                Personal health records
              </span>
              <h1 id="hero-heading" className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                Your medical history, organized and understood.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                Bring every document, record and vital into one place. Envagai turns them into structured data and
                clear insights you can act on.
              </p>
              <ul className="mt-8 space-y-3">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/85">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
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

                {sessionExpired ? (
                  <Alert tone="warning" className="mb-5">
                    Your session has ended. Please sign in again to continue.
                  </Alert>
                ) : null}

                {authMode === 'login' ? (
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
                        onChange={(event) =>
                          setRegisterForm((current) => ({ ...current, accept_terms: event.target.checked }))
                        }
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
                        , including that my documents and questions are processed by an AI provider (OpenAI) to
                        provide the service.
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

              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-heading" className="scroll-mt-16 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-accent-700">Features</p>
              <h2 id="features-heading" className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Everything you need to manage your health records
              </h2>
              <p className="mt-3 text-base text-gray-500">
                From raw documents to clear answers, all in one secure workspace.
              </p>
            </div>

            <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <li key={feature.title} className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how-it-works-heading" className="scroll-mt-16 border-t border-gray-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-accent-700">How it works</p>
              <h2 id="how-it-works-heading" className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Get started in three steps</h2>
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

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-16 border-t border-gray-200/80 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-accent-700">FAQ</p>
              <h2 id="faq-heading" className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Common questions
              </h2>
            </div>
            <dl className="mt-10 divide-y divide-gray-200/80 rounded-xl border border-gray-200/80 bg-white shadow-card">
              {faqs.map((faq) => (
                <div key={faq.question} className="p-5 sm:p-6">
                  <dt className="text-base font-semibold text-gray-900">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-gray-600">
                    {faq.answer}
                    {faq.link ? (
                      <>
                        {' '}
                        <Link to={faq.link.to} className="font-medium text-primary-700 underline hover:text-primary-900">
                          {faq.link.label}
                        </Link>
                      </>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-center text-sm text-gray-500">
              Want to know more?{' '}
              <Link to="/about" className="font-medium text-primary-700 underline hover:text-primary-900">
                Learn about Envagai
              </Link>
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />

      <JsonLd
        data={{
          '@graph': [
            {
              '@type': 'WebApplication',
              '@id': `${absoluteUrl('/')}#app`,
              name: 'Envagai',
              url: absoluteUrl('/'),
              description: PUBLIC_PAGES[0].description,
              applicationCategory: 'HealthApplication',
              operatingSystem: 'Web browser',
              publisher: { '@id': `${absoluteUrl('/')}#organization` },
              featureList: features.map((feature) => feature.title),
            },
            {
              '@type': 'FAQPage',
              '@id': `${absoluteUrl('/')}#faq`,
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ],
        }}
      />
    </div>
  )
}
