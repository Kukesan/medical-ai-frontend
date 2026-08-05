import { useCallback, useEffect, useState } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { listTimeline } from '../service/timelineService'
import type { TimelineEntry } from '../types/api'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
  }).format(date)
}

export function TimelinePage() {
  const { request } = useAuth()

  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadTimeline = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await listTimeline(request)
      const sorted = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setEntries(sorted)
      setStatus('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load timeline')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadTimeline()
  }, [loadTimeline])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
            <p className="mt-2 text-sm text-gray-600">A chronological view of your medical history.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadTimeline()}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#AA1C41] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {status ? <p className="mb-4 text-sm text-gray-700">{status}</p> : null}

        {isLoading ? <p className="text-sm text-gray-600">Loading timeline...</p> : null}

        {!isLoading && entries.length === 0 ? (
          <p className="text-sm text-gray-600">No timeline entries found.</p>
        ) : null}

        {!isLoading && entries.length > 0 ? (
          <ol className="relative ml-3 border-l-2 border-gray-200">
            {entries.map((entry, index) => (
              <li key={`${entry.date}-${index}`} className="mb-8 ml-6 last:mb-0">
                <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-[#AA1C41] shadow" />
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#FBE7EC] px-3 py-1 text-xs font-semibold text-[#AA1C41]">
                      {entry.category}
                    </span>
                    <time className="text-xs font-medium text-gray-500">{formatDate(entry.date)}</time>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{entry.name ?? 'Unknown'}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </div>
  )
}
