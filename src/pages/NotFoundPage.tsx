import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { buttonClassName } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="mx-auto w-full max-w-sm rounded-xl border border-gray-200/80 bg-white p-8 text-center shadow-card">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <AlertTriangle className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <h2 className="font-display text-2xl text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/dashboard" className={buttonClassName('primary', 'md', 'mt-6 w-full')}>
          Back to Dashboard
        </Link>
      </section>
    </div>
  )
}
