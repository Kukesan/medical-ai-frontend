import type { AuthRequest } from '../context/auth-request'
import type { AnalysisRunResponse } from '../types/api'

export function runDocumentAnalysis(request: AuthRequest, documentIds: string[]) {
  return request<AnalysisRunResponse>('/analysis/run', {
    method: 'POST',
    body: JSON.stringify({ document_ids: documentIds }),
  })
}