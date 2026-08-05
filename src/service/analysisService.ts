import type { AuthRequest } from '../context/auth-request'
import type { AnalysisResultItem, AnalysisRunResponse } from '../types/api'

export function runDocumentAnalysis(request: AuthRequest, documentIds: string[]) {
  return request<AnalysisRunResponse>('/analysis/run', {
    method: 'POST',
    body: JSON.stringify({ document_ids: documentIds }),
  })
}

export function analyzeMedicationInteractions(request: AuthRequest) {
  return request<AnalysisRunResponse>('/analysis/analyze-medication-interactions', {
    method: 'POST',
  })
}

export function getAnalysisResults(request: AuthRequest) {
  return request<AnalysisResultItem[]>('/analysis/results')
}

export function getAnalysisResult(request: AuthRequest, resultId: string) {
  return request<AnalysisResultItem>(`/analysis/results/${resultId}`)
}