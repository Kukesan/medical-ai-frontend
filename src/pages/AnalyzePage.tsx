import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AnalysisResultItem, AnalysisRiskLevel } from '../types/api'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { analyzeMedicationInteractions, getAnalysisResults } from '../service/analysisService'

const riskOrder: Record<AnalysisRiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const riskBadgeClass: Record<AnalysisRiskLevel, string> = {
  high: 'bg-red-100 text-red-800 border border-red-200',
  medium: 'bg-amber-100 text-amber-800 border border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
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

  const [results, setResults] = useState<AnalysisResultItem[]>([])
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
      setStatus(response.length === 0 ? 'No analysis reports found yet.' : '')
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
    <section className="mx-auto max-w-3xl space-y-4">
      <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-['Archivo_Black'] text-2xl text-gray-900">Analysis Reports</h1>
            <p className="mt-1 text-sm text-gray-600">Important findings first. Click a record to inspect full details.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isAnalyzing}
              className="rounded-lg bg-[#AA1C41] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f1836] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            <button
              type="button"
              onClick={() => void loadResults()}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#AA1C41] hover:bg-[#FFF1F4] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        {analyzeStatus ? <p className="mt-3 text-sm text-red-700">{analyzeStatus}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Important:</span> {importantCount}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Total:</span> {prioritizedResults.length}
          </p>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-gray-600">Loading analysis reports...</p> : null}
        {!isLoading && status ? <p className="mt-4 text-sm text-red-700">{status}</p> : null}

        {!isLoading && !status ? (
          <div className="mt-4 space-y-2">
            {prioritizedResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => navigate(`/analyze/${result.id}`)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-[#AA1C41]/50 hover:bg-[#FFF7F9]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{result.title}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskBadgeClass[result.risk_level]}`}>
                    {formatRiskLabel(result.risk_level)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatCategory(result.category)} • Confidence {Math.round(result.confidence * 100)}%
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-700">{result.description}</p>
              </button>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  )
}