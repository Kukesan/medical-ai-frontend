import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import type { AnalysisResultListItem, AnalysisRiskLevel } from '../types/api'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { analyzeMedicationInteractions, getAnalysisResults } from '../service/analysisService'
import { Alert, Badge, Button, Card, EmptyState, PageHeader, SkeletonLines, riskTone } from '../components/ui'

const riskOrder: Record<AnalysisRiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
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
      setResults(response)
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
      const riskDiff = riskOrder[a.risk_level] - riskOrder[b.risk_level]
      if (riskDiff !== 0) return riskDiff

      const confidenceDiff = b.confidence - a.confidence
      if (confidenceDiff !== 0) return confidenceDiff

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

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Important:</span> {importantCount}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Total:</span> {prioritizedResults.length}
          </p>
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
          <div className="mt-4 space-y-2">
            {prioritizedResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => navigate(`/analyze/${result.id}`)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-primary-300 hover:bg-primary-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{result.title}</p>
                  <Badge tone={riskTone(result.risk_level)}>{formatRiskLabel(result.risk_level)}</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatCategory(result.category)} • Confidence {Math.round(result.confidence * 100)}%
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-700">{result.description}</p>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
