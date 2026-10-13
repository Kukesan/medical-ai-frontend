import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  EyeOff,
  FileSearch,
  HeartPulse,
  KeyRound,
  ListChecks,
  Lock,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Phone,
  Pill,
  ScanText,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { buttonClassName } from '../components/ui'
import { cn } from '../lib/cn'
import { PublicFooter, PublicHeader } from '../components/PublicLayout'
import { AuthCard, type AuthMode } from '../components/landing/AuthCard'
import { DoctorPreview, HeroPreview, IntakePreview, TimelinePreview } from '../components/landing/Illustrations'
import { ExtractionWorkflow } from '../components/landing/ExtractionWorkflow'
import { JsonLd } from '../components/JsonLd'
import { absoluteUrl, LANDING_SECTIONS, PUBLIC_PAGES } from '../lib/publicPages'
import { usePublicPageMeta } from '../lib/seo'
import { MAX_UPLOAD_MB } from '../service/documentService'
import type { AuthRedirectState } from '../components/ProtectedRoute'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

type FeatureGroup = {
  label: string
  heading: string
  features: Feature[]
}

const featureGroups: FeatureGroup[] = [
  {
    label: 'Understand',
    heading: 'Make sense of your paperwork',
    features: [
      {
        icon: ScanText,
        title: 'Document upload and extraction',
        description: `Upload PDF, PNG or JPEG files up to ${MAX_UPLOAD_MB} MB. Medications, diagnoses and test results are extracted for you to review and correct.`,
      },
      {
        icon: FileSearch,
        title: 'Report and prescription analysis',
        description:
          'Run an AI analysis on your lab reports and prescriptions. Each finding shows a risk level and how confident the analysis is.',
      },
      {
        icon: MessageCircle,
        title: 'Ask the assistant',
        description:
          'Ask questions about a specific document or analysis result and get answers based on your own records.',
      },
    ],
  },
  {
    label: 'Organize',
    heading: 'Keep your history in one place',
    features: [
      {
        icon: Clock,
        title: 'Personal medical timeline',
        description: 'Visits, diagnoses, procedures and other events in one chronological view.',
      },
      {
        icon: HeartPulse,
        title: 'Vital-sign history',
        description: 'Log height, weight, blood pressure and blood sugar, and follow how they change over time.',
      },
      {
        icon: ShieldCheck,
        title: 'Private medical records',
        description:
          'Allergies, vaccinations and surgeries kept organized in your own account. Edit or delete anything, anytime.',
      },
    ],
  },
  {
    label: 'Act',
    heading: 'Know what to do next',
    features: [
      {
        icon: MessagesSquare,
        title: 'Guided entry with follow-up questions',
        description:
          'Describe a health event in your own words. If details are missing, Envagai asks short follow-up questions before you confirm.',
      },
      {
        icon: Pill,
        title: 'Medication interaction checks',
        description: 'Check the medications across your records for possible interactions, ranked by risk.',
      },
      {
        icon: MapPin,
        title: 'Guidance and nearby doctors',
        description:
          'When a finding is higher risk or less certain, Envagai suggests a relevant specialty and finds doctors and clinics near you.',
      },
    ],
  },
]

type Showcase = {
  id: string
  eyebrow: string
  title: string
  description: string
  points: string[]
  preview: ReactNode
}

const showcases: Showcase[] = [
  {
    id: 'guided-entry',
    eyebrow: 'Guided entry',
    title: 'Tell it what happened, the way you would tell a friend',
    description:
      "No forms to decode. Write a sentence about a visit, a vaccination or a new diagnosis, and Envagai turns it into a structured record.",
    points: [
      'Follow-up questions only when an important detail is missing',
      'A handful of questions at most, never an endless interview',
      'Nothing is saved until you review and confirm it',
    ],
    preview: <IntakePreview />,
  },
  {
    id: 'timeline',
    eyebrow: 'Timeline and vitals',
    title: 'Your health history, at a glance',
    description:
      'When a doctor asks "when did that start?", the answer is in one place instead of a drawer full of papers.',
    points: [
      'Events from your records in date order',
      'Vital signs logged over time, so changes are easier to spot',
      'Ready to review before your next appointment',
    ],
    preview: <TimelinePreview />,
  },
  {
    id: 'doctors',
    eyebrow: 'Guidance',
    title: 'Know when to see a doctor, and where',
    description:
      'Some findings deserve a professional opinion. Envagai says so plainly and helps you take the next step.',
    points: [
      'Offered when a finding is high or medium risk, or less certain',
      'A relevant specialty suggested from the finding',
      'Nearby doctors and clinics from Google Maps, with distance and rating',
    ],
    preview: <DoctorPreview />,
  },
]

const steps = [
  { title: 'Create your free account', description: 'Just your name, email address and a password.' },
  {
    title: 'Add your records',
    description: 'Upload documents, or describe a health event in your own words.',
  },
  {
    title: 'Review, ask and act',
    description: 'Check the extracted details, run an analysis and ask questions whenever you need to.',
  },
]

const privacyPoints: Feature[] = [
  {
    icon: Lock,
    title: 'Private to your account',
    description: 'Your records are only available after you sign in. Connections use HTTPS.',
  },
  {
    icon: KeyRound,
    title: 'Passwords stored safely',
    description: 'Passwords are stored as a one-way hash, never in readable form.',
  },
  {
    icon: EyeOff,
    title: 'Never sold or used for ads',
    description: 'Service providers such as OpenAI process your data only to run Envagai on our behalf.',
  },
  {
    icon: Trash2,
    title: 'Delete anytime',
    description: 'Remove individual documents and records, or permanently delete your whole account.',
  },
]

const aiPoints: Feature[] = [
  {
    icon: ListChecks,
    title: 'You review what the AI extracts',
    description: 'AI can misread a document, so extracted details are shown for you to check and correct.',
  },
  {
    icon: BadgeCheck,
    title: 'Risk and confidence are visible',
    description: 'Analysis findings show how serious they may be and how certain the analysis is.',
  },
  {
    icon: MessageCircle,
    title: 'Answers grounded in your records',
    description: 'The assistant answers from your documents and analysis results, not from guesswork about you.',
  },
  {
    icon: ShieldCheck,
    title: 'No diagnosis, no treatment plans',
    description: 'Envagai helps you prepare for conversations with professionals. It does not replace them.',
  },
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
    answer: `You can upload prescriptions, lab reports, discharge notes and similar documents as PDF, PNG or JPEG files up to ${MAX_UPLOAD_MB} MB. You can also describe a medical event in your own words.`,
  },
  {
    question: 'How does Envagai read my documents?',
    answer:
      'An AI model extracts key details such as medications, diagnoses and test results. You can review and correct the extracted details, because AI can make mistakes.',
  },
  {
    question: 'Why does Envagai sometimes ask me follow-up questions?',
    answer:
      'When you describe a medical event in your own words and an important detail, such as a date, is missing, Envagai asks a few short questions. You review the resulting record and confirm it before anything is saved.',
  },
  {
    question: 'Can I ask questions about a specific report?',
    answer:
      'Yes. In the chat you can focus a conversation on a particular document or analysis result, and the assistant answers using that context. Its answers are information, not medical advice.',
  },
  {
    question: 'How does the medication interaction check work?',
    answer:
      'Envagai analyzes the medications in your records for possible interactions and ranks the findings by risk. Results may be incomplete, so confirm them with your doctor or pharmacist.',
  },
  {
    question: 'How does Envagai suggest doctors?',
    answer:
      'When an analysis finding is high or medium risk, or the analysis is less confident, Envagai suggests a relevant specialty and lets you search for doctors and clinics near a location you enter, using Google Maps. Envagai does not book appointments or endorse any provider.',
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

const heroAssurances = ['Free to create an account', 'Never sold or used for ads', 'Delete your data anytime']

const supportedDocuments = ['Prescriptions', 'Lab reports', 'Discharge notes', 'Scans and photos']

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  align?: 'center' | 'left'
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <p className="text-sm font-semibold text-accent-700">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">{description}</p> : null}
    </div>
  )
}

function PointList({ points }: { points: Feature[] }) {
  return (
    <ul className="mt-6 space-y-5">
      {points.map((point) => (
        <li key={point.title} className="flex gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <point.icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{point.title}</h4>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{point.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function AuthPage() {
  const location = useLocation()
  usePublicPageMeta(location.pathname)
  const { isAuthenticated, sessionExpired } = useAuth()
  // Where to go after signing in: the protected page that sent the user here, else the dashboard.
  const redirectState = location.state as AuthRedirectState | null
  const redirectTo = redirectState?.from ?? '/dashboard'

  // /auth and redirects from protected pages are for returning users; the homepage leads with sign-up.
  const isSignInIntent = location.pathname === '/auth' || !!redirectState?.from || sessionExpired
  const [authMode, setAuthMode] = useState<AuthMode>(isSignInIntent ? 'login' : 'register')
  const authCardRef = useRef<HTMLDivElement>(null)

  // Router links like "/#features" don't scroll by themselves.
  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    }
  }, [location.hash])

  // Returning users landing on /auth go straight to the form rather than the marketing hero.
  // Decided once on arrival, so later state changes never yank the page around.
  const scrollToFormOnArrival = useRef(isSignInIntent && !location.hash)
  useEffect(() => {
    if (scrollToFormOnArrival.current) {
      authCardRef.current?.scrollIntoView({ block: 'center' })
    }
  }, [])

  const openAuth = useCallback((mode: AuthMode) => {
    setAuthMode(mode)
    const card = authCardRef.current
    if (!card) {
      return
    }
    card.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
    // Move focus into the form for keyboard and screen-reader users, without a second scroll jump.
    window.setTimeout(() => card.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }), 0)
  }, [])

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-700 focus:shadow-pop"
      >
        Skip to content
      </a>

      <PublicHeader
        links={LANDING_SECTIONS.map((item) => ({ ...item, href: item.href.replace('/', '') }))}
        actions={
          <>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className={buttonClassName('ghost', 'md', 'hidden sm:inline-flex')}
            >
              Sign in
            </button>
            <button type="button" onClick={() => openAuth('register')} className={buttonClassName('primary', 'md')}>
              Get started
            </button>
          </>
        }
        mobileActions={
          <button
            type="button"
            onClick={() => openAuth('login')}
            className={buttonClassName('secondary', 'lg', 'w-full sm:hidden')}
          >
            Sign in
          </button>
        }
      />

      <main id="main">
        {/* Hero */}
        <section className="bg-canvas" aria-labelledby="hero-heading">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-semibold text-primary-700">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
                Your AI medical records assistant
              </p>
              <h1
                id="hero-heading"
                className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.4rem]"
              >
                Understand your medical reports. <span className="text-primary-600">Keep your health story together.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
                Upload a prescription, lab report or discharge note. Envagai pulls out the key details, flags possible
                medication interactions and answers your questions from your own records, so you arrive at
                appointments prepared.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className={buttonClassName('primary', 'lg', 'h-12 px-6 text-base')}
                >
                  Create a free account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a href="#workflow" className={buttonClassName('secondary', 'lg', 'h-12 px-6 text-base')}>
                  See how it works
                </a>
              </div>

              <ul className="mt-8 flex flex-col gap-x-6 gap-y-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap">
                {heroAssurances.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-rise-in [--rise-delay:120ms]">
              <HeroPreview />
            </div>
          </div>

          <div className="border-t border-gray-200/70">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 sm:px-6 md:flex-row md:justify-between">
              <p className="text-sm font-medium text-gray-500">Works with the paperwork you already have</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {supportedDocuments.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <ExtractionWorkflow />

        {/* Features */}
        <section id="features" aria-labelledby="features-heading" className="scroll-mt-16 border-t border-gray-200/70 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              id="features-heading"
              eyebrow="Features"
              title="From a pile of documents to clear next steps"
              description="Envagai brings together the tools you need to understand, organize and act on your health information, in one private account."
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {featureGroups.map((group) => (
                <section
                  key={group.label}
                  aria-labelledby={`group-${group.label}`}
                  className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-card sm:p-7"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">{group.label}</p>
                  <h3 id={`group-${group.label}`} className="mt-1.5 text-xl font-bold text-gray-900">
                    {group.heading}
                  </h3>
                  <PointList points={group.features} />
                </section>
              ))}
            </div>

            <div className="mt-24 space-y-24">
              {showcases.map((showcase, index) => (
                <section
                  key={showcase.id}
                  aria-labelledby={`showcase-${showcase.id}`}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                >
                  <div className={cn(index % 2 === 1 && 'lg:order-2')}>
                    <p className="text-sm font-semibold text-accent-700">{showcase.eyebrow}</p>
                    <h3
                      id={`showcase-${showcase.id}`}
                      className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
                    >
                      {showcase.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-gray-600">{showcase.description}</p>
                    <ul className="mt-6 space-y-3">
                      {showcase.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl bg-canvas p-5 sm:p-10">{showcase.preview}</div>
                </section>
              ))}
            </div>
          </div>
        </section>

        {/* How it works + sign-up */}
        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="scroll-mt-16 border-t border-gray-200/70 bg-canvas py-20 sm:py-28"
        >
          <div id="get-started" className="mx-auto grid max-w-6xl scroll-mt-16 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                id="how-it-works-heading"
                eyebrow="How it works"
                title="Get started in three steps"
                description="Set up your account now and add your first document whenever you are ready."
                align="left"
              />
              <ol className="mt-10 space-y-8">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="pt-1.5">
                      <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <AuthCard ref={authCardRef} mode={authMode} onModeChange={setAuthMode} redirectTo={redirectTo} />
          </div>
        </section>

        {/* Safety and privacy */}
        <section id="safety" aria-labelledby="safety-heading" className="scroll-mt-16 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              id="safety-heading"
              eyebrow="Safety and privacy"
              title="Built to support your care, not replace it"
              description="Health information is personal. Here is exactly how Envagai protects it, and where its AI stops."
            />

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <section aria-labelledby="privacy-points" className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-card sm:p-8">
                <h3 id="privacy-points" className="text-xl font-bold text-gray-900">
                  Your data stays yours
                </h3>
                <PointList points={privacyPoints} />
                <Link
                  to="/privacy"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900"
                >
                  Read the Privacy Policy
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </section>

              <section aria-labelledby="ai-points" className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-card sm:p-8">
                <h3 id="ai-points" className="text-xl font-bold text-gray-900">
                  AI that is honest about its limits
                </h3>
                <PointList points={aiPoints} />
                <Link
                  to="/terms"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-900"
                >
                  Read the Terms of Use
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </section>
            </div>

            <aside
              aria-label="Emergency notice"
              className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/70 p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-red-900">
                <strong className="font-semibold">Envagai is not for emergencies.</strong> If you think you may have a
                medical emergency, contact your local emergency services or go to the nearest emergency department
                immediately.
              </p>
            </aside>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="scroll-mt-16 border-t border-gray-200/70 bg-canvas py-20 sm:py-28"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading id="faq-heading" eyebrow="FAQ" title="Questions people ask before signing up" />
            <div className="mt-12 divide-y divide-gray-200/80 rounded-2xl border border-gray-200/80 bg-white shadow-card">
              {faqs.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-left text-base font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20 sm:px-6 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-gray-600 sm:px-6">
                    {faq.answer}
                    {faq.link ? (
                      <>
                        {' '}
                        <Link to={faq.link.to} className="font-medium text-primary-700 underline hover:text-primary-900">
                          {faq.link.label}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-gray-600">
              Want to know more?{' '}
              <Link to="/about" className="font-medium text-primary-700 underline hover:text-primary-900">
                Learn about Envagai
              </Link>
            </p>
          </div>
        </section>

        {/* Closing call to action */}
        <section aria-labelledby="cta-heading" className="bg-primary-800">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 id="cta-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Bring your medical paperwork into one clear picture.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
                Create your free account, upload your first document and see what Envagai finds.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => openAuth('register')}
                className={buttonClassName(
                  'primary',
                  'lg',
                  'h-12 bg-accent-400 px-6 text-base text-primary-900 hover:bg-accent-300 focus-visible:ring-accent-300/40',
                )}
              >
                Create a free account
              </button>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className={buttonClassName(
                  'ghost',
                  'lg',
                  'h-12 px-6 text-base text-white ring-1 ring-inset ring-white/30 hover:bg-white/10 hover:text-white',
                )}
              >
                Sign in
              </button>
            </div>
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
              featureList: featureGroups.flatMap((group) => group.features.map((feature) => feature.title)),
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
