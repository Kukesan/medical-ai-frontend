import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { AnalysisResultItem, AnalysisRiskLevel } from '../types/api'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getAnalysisResult } from '../service/analysisService'

const riskBadgeClass: Record<AnalysisRiskLevel, string> = {
  high: 'bg-red-100 text-red-800 border border-red-200',
  medium: 'bg-amber-100 text-amber-800 border border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
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

export function AnalysisResultDetailsPage() {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate = useNavigate()
  const { request } = useAuth()

  const [result, setResult] = useState<AnalysisResultItem | null>(null)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadResult = useCallback(async () => {
    if (!resultId) return
    setIsLoading(true)
    setStatus('')
    try {
      const data = await getAnalysisResult(request, resultId)
      setResult(data)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load analysis result.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request, resultId])

  useEffect(() => {
    void loadResult()
  }, [loadResult])

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/analyze')}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#AA1C41] hover:bg-[#FFF1F4] hover:text-[#AA1C41]"
        >
          ← Back
        </button>
        <h1 className="font-['Archivo_Black'] text-2xl text-gray-900">Analysis Detail</h1>
      </div>

      {isLoading && <p className="text-sm text-gray-600">Loading...</p>}
      {!isLoading && status && <p className="text-sm text-red-700">{status}</p>}

      {!isLoading && result && (
        <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{result.title}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {formatCategory(result.category)} • Created {formatDate(result.created_at)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeClass[result.risk_level]}`}>
              {formatRiskLabel(result.risk_level)} Risk
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Confidence:</span> {Math.round(result.confidence * 100)}%
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Recommendation:</span> {result.recommendation}
            </p>
          </div>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Description</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">{result.description}</p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Clinical Reason</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">{result.clinical_reason}</p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Timeline</h3>
            {result.timeline.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No timeline entries.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {result.timeline.map((item, index) => (
                  <div key={`${item.document_id}-${item.date}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                    <p className="mt-1 text-sm text-gray-700">{item.finding}</p>
                    <p className="mt-2 text-xs text-gray-500">Document: {item.document_id}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Evidence</h3>
            {result.evidence.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No evidence snippets.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {result.evidence.map((item, index) => (
                  <div key={`${item.document_id}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-sm text-gray-700">{item.snippet}</p>
                    <p className="mt-2 text-xs text-gray-500">Document: {item.document_id}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </article>
      )}
    </section>
  )
}
