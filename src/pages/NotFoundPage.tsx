import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { buttonClassName } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/40 px-4">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-brand">
          <AlertTriangle className="h-8 w-8 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="font-display text-2xl text-gray-900">Page Not Found</h2>
        <p className="mt-3 text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className={buttonClassName('primary', 'lg', 'mt-6 w-full')}>
          Back to Dashboard
        </Link>
      </section>
    </div>
  )
}
