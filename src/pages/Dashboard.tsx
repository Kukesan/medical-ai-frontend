import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Footprints,
  HeartPulse,
  Moon,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { describeError } from '../lib/describeError'
import { useAuth } from '../context/useAuth'
import { getAlerts } from '../service/dashboardService'
import { listVitals } from '../service/vitalsService'
import type { AlertItem, VitalsEntry } from '../types/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  SkeletonLines,
  inferStatusTone,
  riskTone,
} from '../components/ui'

type HealthTip = {
  icon: LucideIcon
  title: string
  description: string 
}

const healthTips: HealthTip[] = [
  // {
  //   icon: Droplets,
  //   title: 'Stay Hydrated',
  //   description: 'Drink at least 8 glasses of water a day to support circulation, digestion, and kidney health.',
  // },
  {
    icon: Footprints,
    title: 'Move Every Day',
    description: 'Aim for 30 minutes of moderate activity, like walking, to keep your heart and joints healthy.',
  },
  // {
  //   icon: Apple,
  //   title: 'Eat the Rainbow',
  //   description: 'Fill half your plate with fruits and vegetables for essential vitamins, minerals, and fiber.',
  // },
  {
    icon: Moon,
    title: 'Prioritize Sleep',
    description: 'Get 7 to 9 hours of quality sleep each night to help your body repair and regulate hormones.',
  },
  // {
  //   icon: Brain,
  //   title: 'Manage Stress',
  //   description: 'Take a few minutes daily for deep breathing or mindfulness to keep stress levels in check.',
  // },
  {
    icon: Stethoscope,
    title: 'Routine Checkups',
    description: 'Schedule regular screenings and doctor visits to catch potential issues early.',
  },
]

export function DashboardPage() {
  const { request } = useAuth()

  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [latestVitals, setLatestVitals] = useState<VitalsEntry | null>(null)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    // Load independently: if one section fails, the other still shows.
    const [alertsResult, vitalsResult] = await Promise.allSettled([getAlerts(request), listVitals(request)])

    if (alertsResult.status === 'fulfilled') {
      setAlerts(alertsResult.value)
    }
    if (vitalsResult.status === 'fulfilled') {
      setLatestVitals(
        [...vitalsResult.value].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0] ?? null,
      )
    }

    const firstFailure = [alertsResult, vitalsResult].find((result) => result.status === 'rejected')
    setStatus(firstFailure ? describeError(firstFailure.reason, 'Some dashboard data could not be loaded') : '')
    setIsLoading(false)
  }, [request])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to the Envagai Dashboard!"
        actions={
          <Button variant="secondary" onClick={() => void loadDashboard()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      {status ? <Alert tone={inferStatusTone(status)}>{status}</Alert> : null}

      <Card>
        <div className="mb-5 flex items-center gap-3">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-brand">
            <Activity className="h-5 w-5" />
          </div> */}
          <div>
            <h2 className="text-base font-semibold text-gray-900">Daily Health Tips</h2>
            <p className="mt-0.5 text-sm text-gray-500">Small habits that add up to better health.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {healthTips.map((tip) => (
            <div key={tip.title} className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <tip.icon className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{tip.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{tip.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-brand">
                <HeartPulse className="h-5 w-5" />
              </div> */}
              <h2 className="text-base font-semibold text-gray-900">Vitals</h2>
            </div>
            <Link to="/profile" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View history &rarr;
            </Link>
          </div>
          {isLoading ? (
            <SkeletonLines count={4} />
          ) : !latestVitals ? (
            <EmptyState icon={HeartPulse} title="No vitals recorded yet." />
          ) : (
            <div>
              <p className="text-xs text-gray-500">Recorded {latestVitals.recorded_at}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                  <dt className="text-xs text-gray-500">Height</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                    {latestVitals.height ?? '-'} {latestVitals.height ? 'cm' : ''}
                  </dd>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                  <dt className="text-xs text-gray-500">Weight</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-gray-900">
                    {latestVitals.weight ?? '-'} {latestVitals.weight ? 'kg' : ''}
                  </dd>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                  <dt className="text-xs text-gray-500">Blood Group</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-gray-900">{latestVitals.blood_group ?? '-'}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                  <dt className="text-xs text-gray-500">Pressure</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-gray-900">{latestVitals.pressure ?? '-'}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2.5">
                  <dt className="text-xs text-gray-500">Blood Sugar (mg/dL)</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-gray-900">{latestVitals.blood_sugar ?? '-'}</dd>
                </div>
              </dl>
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-brand">
                <AlertTriangle className="h-5 w-5" />
              </div> */}
              <h2 className="text-base font-semibold text-gray-900">Alerts</h2>
            </div>
            <Link to="/analyze" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View analysis &rarr;
            </Link>
          </div>
          {isLoading ? (
            <SkeletonLines count={3} />
          ) : alerts.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No alerts found." />
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-gray-100 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                    <Badge tone={riskTone(alert.risk_level)}>{alert.risk_level}</Badge>
                  </div>
                  {/* <p className="mt-2 text-xs font-medium text-gray-500">{formatCategory(alert.category)}</p>
                  <p className="mt-2 text-sm text-gray-700">{alert.description}</p>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Confidence: {Math.round(alert.confidence * 100)}%
                  </p> */}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
