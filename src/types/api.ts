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

export type MedicationItem = {
  name: string
  dosage: string | null
  dosage_value: number | null
  dosage_unit: string | null
  frequency: string | null
  duration: string | null
  start_date: string | null
  end_date: string | null
  confidence: number | null
}

export type DocumentDetails = DocumentItem & {
  visit_date: string | null
  doctor_name: string | null
  hospital_name: string | null
  medications: MedicationItem[]
  lab_results: Array<Record<string, unknown>>
  diagnosis_text: string | null
  clinical_notes: string[]
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

export type AnalysisRiskLevel = 'low' | 'medium' | 'high'

export type AnalysisTimelineItem = {
  document_id: string
  date: string
  finding: string
}

export type AnalysisEvidenceItem = {
  document_id: string
  snippet: string
}

export type AnalysisResultItem = {
  id: string
  user_id: string
  category: string
  risk_level: AnalysisRiskLevel
  title: string
  description: string
  clinical_reason: string
  confidence: number
  timeline: AnalysisTimelineItem[]
  evidence: AnalysisEvidenceItem[]
  recommendation: string
  created_at: string
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

export type AllergyItem = {
  id: string
  substance: string
  severity: string
  reaction: string
}

export type VaccinationItem = {
  id: string
  user_id: string
  name: string
  date_administered: string
  is_next_due: boolean
  next_due_date: string | null
}

export type SurgeryItem = {
  id: string
  name: string
  date: string
  notes: string
}

export type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
}
