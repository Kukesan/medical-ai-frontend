export type AppUser = {
  id: string
  email: string
  full_name: string
  is_active: boolean
}

export type AuthTokens = {
  access_token: string
  refresh_token: string
  token_type: string
}

export type DocumentItem = {
  id: string
  file_name: string
  mime_type: string
  file_size: number
  document_type: string
  processing_status: string
  created_at: string
}

export type UploadResult = {
  uploaded: Array<{
    file_name: string
    document_id: string
    status: string
  }>
  failed: Array<{
    file_name: string
    reason: string
  }>
}

export type AnalysisRunResponse = {
  status: string
  message: string
}

export type TimelineResponse = {
  timeline: Array<{
    visit_id: string
    visit_date: string
    doctor_name: string
    hospital_name: string
    medications: string[]
    labs: string[]
    notes: string[]
  }>
}

export type LabTrendsResponse = {
  trends: Array<{
    test_name: string
    trend_direction: string
    normal_range_comparison: string
    explanation: string
    confidence: number
  }>
  warning?: {
    message: string
    recommend_doctor_consult: boolean
  }
}

export type AlertItem = {
  category: string
  details: string
  assessment: {
    risk_level: string
    explanation: string
    confidence: number
    evidence: Array<{
      source_document_id: string
      snippet: string
      page: number
    }>
  }
}

export type ChatResponse = {
  session_id: string
  answer: string
  confidence: number
  citations: Array<{
    source_document_id: string
    snippet: string
    page: number
  }>
  warning?: {
    message: string
    recommend_doctor_consult: boolean
  }
}

export type ChatHistoryResponse = {
  session_id: string
  messages: Array<{
    role: string
    content: string
    confidence: number
    created_at: string
  }>
}

export type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
}
