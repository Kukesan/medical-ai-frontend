import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  Brain,
  Clock,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Shield,
  Stethoscope,
  Syringe,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { cn } from '../lib/cn'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/timeline', label: 'Timeline', icon: Clock },
    ],
  },
  {
    label: 'Records',
    items: [
      { to: '/document', label: 'Documents', icon: FileText },
      { to: '/analyze', label: 'Analyze', icon: Brain },
      { to: '/allergy', label: 'Allergies', icon: Shield },
      { to: '/vaccination', label: 'Vaccinations', icon: Syringe },
      { to: '/surgery', label: 'Surgeries', icon: Stethoscope },
    ],
  },
  {
    label: 'Assistant',
    items: [
      { to: '/chat', label: 'Chat', icon: MessageCircle },
      { to: '/profile', label: 'Profile', icon: User },
    ],
  },
]

const pageTitles: Array<[string, string]> = [
  ['/dashboard', 'Dashboard'],
  ['/timeline', 'Timeline'],
  ['/document', 'Documents'],
  ['/analyze', 'Analysis'],
  ['/allergy', 'Allergies'],
  ['/vaccination', 'Vaccinations'],
  ['/surgery', 'Surgeries'],
  ['/chat', 'Chat'],
  ['/profile', 'Profile'],
]

function usePageTitle(pathname: string) {
  const match = pageTitles.find(([prefix]) => pathname.startsWith(prefix))
  return match ? match[1] : 'Medical AI Portal'
}

function Logo() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-brand">
      <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
    </div>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all',
      isActive
        ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-inset ring-primary-200'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <nav className="mt-8 flex flex-col gap-6" aria-label="Primary">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3.5 text-xs font-bold uppercase tracking-wider text-gray-400">{group.label}</p>
          <div className="grid gap-1">
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} onClick={onNavigate}>
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pageTitle = usePageTitle(location.pathname)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-gray-200 bg-white p-6 md:flex">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Medical AI</p>
            <p className="text-sm font-semibold text-gray-900">Yarlit Portal</p>
          </div>
        </div>

        <NavList />

        <button
          type="button"
          className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" strokeWidth={2.25} />
          Logout
        </button>
      </aside>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsMobileNavOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[80vw] animate-fade-in flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Medical AI</p>
                  <p className="text-sm font-semibold text-gray-900">Yarlit Portal</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <NavList onNavigate={() => setIsMobileNavOpen(false)} />

            <button
              type="button"
              className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" strokeWidth={2.25} />
              Logout
            </button>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Open menu"
                className="-ml-1.5 rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="font-display text-xl text-gray-900 sm:text-2xl">{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  {user.full_name}
                </div>
              ) : null}
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 md:hidden"
                onClick={logout}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
