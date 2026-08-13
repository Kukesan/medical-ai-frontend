import { useCallback, useEffect, useState } from 'react'
import { Activity, Clock, FlaskConical, Pill } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getAlerts, getLabTrends, getMedications, getTimeline } from '../service/dashboardService'
import type { AlertItem, LabTrendsResponse, TimelineEntry } from '../types/api'
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonLines, riskTone, trendTone } from '../components/ui'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

export function DashboardPage() {
  const { request } = useAuth()

  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [medications, setMedications] = useState<string[]>([])
  const [labTrends, setLabTrends] = useState<LabTrendsResponse | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    try {
      const [timelineList, medicationList, trends, alertList] = await Promise.all([
        getTimeline(request),
        getMedications(request),
        getLabTrends(request),
        getAlerts(request),
      ])

      const sortedTimeline = [...timelineList].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )

      setTimeline(sortedTimeline)
      setMedications(medicationList)
      setLabTrends(trends)
      setAlerts(alertList)
      setStatus('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to the Yarlit Medical AI Dashboard!"
        actions={
          <Button variant="secondary" onClick={() => void loadDashboard()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      {status ? (
        <Card className="p-4 text-sm text-gray-700 sm:p-4">{status}</Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Timeline</h2>
          </div>
          {isLoading ? (
            <SkeletonLines count={4} />
          ) : timeline.length === 0 ? (
            <EmptyState icon={Clock} title="No timeline entries found." />
          ) : (
            <ol className="relative ml-3 border-l-2 border-gray-200">
              {timeline.slice(0, 5).map((entry, index) => (
                <li key={`${entry.date}-${index}`} className="mb-6 ml-6 last:mb-0">
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

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Medications</h2>
          </div>
          {isLoading ? (
            <SkeletonLines count={3} />
          ) : medications.length === 0 ? (
            <EmptyState icon={Pill} title="No medications found." />
          ) : (
            <ul className="flex flex-col gap-2">
              {medications.map((medication, index) => (
                <li
                  key={`${medication}-${index}`}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900"
                >
                  {medication}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Lab Trends</h2>
          </div>
          {labTrends?.warning ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>{labTrends.warning.message}</p>
              {labTrends.warning.recommend_doctor_consult ? (
                <p className="mt-1 font-semibold">A doctor consultation is recommended.</p>
              ) : null}
            </div>
          ) : null}
          {isLoading ? (
            <SkeletonLines count={4} />
          ) : !labTrends || labTrends.trends.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No lab trends found." />
          ) : (
            <div className="flex flex-col gap-3">
              {labTrends.trends.map((trend, index) => (
                <div key={`${trend.test_name}-${index}`} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{trend.test_name}</p>
                    <Badge tone={trendTone(trend.trend_direction)}>{trend.trend_direction}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{trend.normal_range_comparison}</p>
                  <p className="mt-2 text-sm text-gray-700">{trend.explanation}</p>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Confidence: {Math.round(trend.confidence * 100)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
          </div>
          {isLoading ? (
            <SkeletonLines count={3} />
          ) : alerts.length === 0 ? (
            <EmptyState icon={Activity} title="No alerts found." />
          ) : (
            <div className="flex flex-col gap-3">
              {alerts.map((alert, index) => (
                <div key={`${alert.category}-${index}`} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{alert.category}</p>
                    <Badge tone={riskTone(alert.assessment.risk_level)}>{alert.assessment.risk_level}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{alert.details}</p>
                  <p className="mt-2 text-sm text-gray-600">{alert.assessment.explanation}</p>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Confidence: {Math.round(alert.assessment.confidence * 100)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
