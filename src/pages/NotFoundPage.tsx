import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#AA1C41] to-[#D62551] shadow-lg shadow-[#AA1C41]/20">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="font-['Archivo_Black'] text-2xl text-gray-900">Page Not Found</h2>
        <p className="mt-3 text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
        <Link
          to="/workflow"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#AA1C41] to-[#D62551] px-6 py-3 font-semibold text-white shadow-lg shadow-[#AA1C41]/25 transition hover:shadow-xl hover:shadow-[#AA1C41]/30"
        >
          Back to Workflow
        </Link>
      </section>
    </div>
  )
}
