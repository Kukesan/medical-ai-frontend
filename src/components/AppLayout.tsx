import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function AppLayout() {
  const { apiBase, user, logout } = useAuth()
  const location = useLocation()
  const pageTitle = location.pathname.includes('/workflow') ? 'Workflow Console' : 'Medical AI Portal'

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all',
      isActive
        ? 'border-[#AA1C41] bg-[#FFF1F4] text-[#AA1C41] shadow-sm'
        : 'border-gray-200 bg-white text-gray-700 hover:border-[#AA1C41]/40 hover:bg-[#FFF1F4]/30 hover:text-[#AA1C41]',
    ].join(' ')

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-gray-200 bg-white p-6 shadow-sm md:flex">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#AA1C41] to-[#D62551] shadow-lg shadow-[#AA1C41]/20">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#AA1C41]">Medical AI</p>
        {/* <h1 className="mt-2 text-2xl leading-tight text-gray-900">Clinical Operations</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Secure upload, analysis, dashboarding, and chat workflows for medical operations.
        </p> */}

        <nav className="mt-8 grid gap-2.5" aria-label="Primary">
          <NavLink to="/dashboard" className={navClass}>
            🏠 Dashboard
          </NavLink>
          <NavLink to="/document" className={navClass}>
            📤 Document
          </NavLink>
          <NavLink to="/analyze" className={navClass}>
            🧠 Analyze
          </NavLink>
          <NavLink to="/chat" className={navClass}>
            💬 Chat
          </NavLink>
          {/* <NavLink to="/workflow" className={navClass}>
            📊 Workflow
          </NavLink> */}
          <NavLink to="/allergy" className={navClass}>
            ⚠️ Allergy
          </NavLink>
          <NavLink to="vaccination" className={navClass}>
            💉 Vaccination
          </NavLink>
          <NavLink to="/surgery" className={navClass}>
            🏥 Surgery
          </NavLink>
          <NavLink to="/profile" className={navClass}>
            👤 Profile
          </NavLink>
        </nav>

        <button
          type="button"
          className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-[#AA1C41] hover:bg-[#FFF1F4] hover:text-[#AA1C41]"
          onClick={logout}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {/* <p className="text-xs font-semibold uppercase tracking-wider text-[#AA1C41]">Production Workspace</p> */}
              <h2 className="font-['Archivo_Black'] text-xl text-gray-900 sm:text-2xl">{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  {user.full_name}
                </div>
              ) : null}
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#AA1C41] hover:bg-[#FFF1F4] hover:text-[#AA1C41] md:hidden"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>

          <nav className="mt-3 flex gap-2 md:hidden" aria-label="Primary">
            <NavLink to="/workflow" className={navClass}>
              Workflow
            </NavLink>
            <NavLink to="/auth" className={navClass}>
              Auth
            </NavLink>
          </nav>
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
