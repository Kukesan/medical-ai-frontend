import { useCallback, useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { listTimeline } from '../service/timelineService'
import type { TimelineEntry } from '../types/api'
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonLines } from '../components/ui'

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
      <PageHeader
        title="Timeline"
        description="A chronological view of your medical history."
        actions={
          <Button variant="secondary" onClick={() => void loadTimeline()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <Card>
        {status ? <p className="mb-4 text-sm text-gray-700">{status}</p> : null}

        {isLoading ? (
          <SkeletonLines count={5} />
        ) : entries.length === 0 ? (
          <EmptyState icon={Clock} title="No timeline entries found." />
        ) : (
          <ol className="relative ml-3 border-l-2 border-gray-200">
            {entries.map((entry, index) => (
              <li key={`${entry.date}-${index}`} className="mb-8 ml-6 last:mb-0">
                <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary-600 shadow" />
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone="primary">{entry.category}</Badge>
                    <time className="text-xs font-medium text-gray-500">{formatDate(entry.date)}</time>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">{entry.name ?? 'Unknown'}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}
