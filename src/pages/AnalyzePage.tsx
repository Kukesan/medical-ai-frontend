import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Brain, Calendar, ChevronRight, Gauge, Layers, ShieldAlert, Stethoscope } from 'lucide-react'
import type { AnalysisResultListItem, AnalysisRiskLevel } from '../types/api'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { analyzeMedicationInteractions, getAnalysisResults } from '../service/analysisService'
import { Alert, Badge, Button, Card, EmptyState, PageHeader, SkeletonLines, riskTone } from '../components/ui'
import { cn } from '../lib/cn'

const riskAccent: Record<AnalysisRiskLevel, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
}

const riskIconStyle: Record<AnalysisRiskLevel, string> = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-emerald-50 text-emerald-600',
}

const LOW_CONFIDENCE_THRESHOLD = 0.8

function needsDoctorRecommendation(item: AnalysisResultListItem) {
  return item.risk_level === 'high' || item.risk_level === 'medium' || item.confidence < LOW_CONFIDENCE_THRESHOLD
}

function formatRiskLabel(riskLevel: AnalysisRiskLevel) {
  return riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)
}

function formatCategory(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function AnalyzePage() {
  const { request } = useAuth()
  const navigate = useNavigate()

  const [results, setResults] = useState<AnalysisResultListItem[]>([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeStatus, setAnalyzeStatus] = useState('')

  const loadResults = useCallback(async () => {
    setIsLoading(true)
    setStatus('')

    try {
      const response = await getAnalysisResults(request)
      setResults(Array.isArray(response) ? response.filter((item): item is AnalysisResultListItem => Boolean(item)) : [])
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load analysis reports.')
      }
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadResults()
  }, [loadResults])

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true)
    setAnalyzeStatus('')

    try {
      await analyzeMedicationInteractions(request)
      await loadResults()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setAnalyzeStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setAnalyzeStatus(error.message)
      } else {
        setAnalyzeStatus('Unable to analyze medication interactions.')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }, [request, loadResults])

  const prioritizedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      // const riskDiff = riskOrder[a.risk_level] - riskOrder[b.risk_level]
      // if (riskDiff !== 0) return riskDiff

      // const confidenceDiff = b.confidence - a.confidence
      // if (confidenceDiff !== 0) return confidenceDiff

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [results])

  const importantCount = prioritizedResults.filter((item) => item.risk_level !== 'low').length

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-6">
      <PageHeader
        title="Analysis Reports"
        description="Important findings first. Click a record to inspect full details."
        actions={
          <>
            <Button onClick={() => void handleAnalyze()} isLoading={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
            <Button variant="secondary" onClick={() => void loadResults()} isLoading={isLoading}>
              Refresh
            </Button>
          </>
        }
      />

      <Card>
        {analyzeStatus ? (
          <Alert tone="danger" className="mb-4">
            {analyzeStatus}
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <ShieldAlert className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-lg font-semibold leading-none text-gray-900">{importantCount}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Important</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-lg font-semibold leading-none text-gray-900">{prioritizedResults.length}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <SkeletonLines count={4} className="mt-4" />
        ) : status ? (
          <Alert tone="danger" className="mt-4">
            {status}
          </Alert>
        ) : prioritizedResults.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="No analysis reports found yet."
            description="Run an analysis to generate medication interaction reports."
            className="mt-4"
          />
        ) : (
          <div className="mt-4 space-y-2.5">
            {prioritizedResults.map((result) => (
              <div
                key={result.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/analyze/${result.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/analyze/${result.id}`)
                  }
                }}
                className="group relative flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-lg border border-gray-200/80 bg-white p-4 pl-5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20"
              >
                <span className={cn('absolute inset-y-0 left-0 w-1', riskAccent[result.risk_level])} />

                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    riskIconStyle[result.risk_level],
                  )}
                >
                  {result.risk_level === 'low' ? (
                    <Gauge className="h-[18px] w-[18px]" />
                  ) : (
                    <AlertTriangle className="h-[18px] w-[18px]" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{result.title}</p>
                    <div className="flex items-center gap-2">
                      {needsDoctorRecommendation(result) ? (
                        <button
                          type="button"
                          title="Doctor recommendation suggested"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/analyze/${result.id}#doctor-recommendation`)
                          }}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition hover:bg-amber-200"
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <Badge tone={riskTone(result.risk_level)}>{formatRiskLabel(result.risk_level)}</Badge>
                    </div>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="font-medium text-gray-600">{formatCategory(result.category)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5" />
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(result.created_at)}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{result.description}</p>
                </div>

                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
