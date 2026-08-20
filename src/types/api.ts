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

export type ProcessingStatus =
  | 'uploaded'
  | 'ocr_completed'
  | 'extracted'
  | 'analyzed'
  | 'user_edited'
  | 'accepted'
  | 'failed'

export type DocumentItem = {
  id: string
  file_name: string
  mime_type: string
  file_size: number
  document_type: string
  processing_status: ProcessingStatus
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
  extraction_result: Record<string, unknown> | null
}

export type DocumentRecordItem = {
  record_type: string
  data: Record<string, unknown>
  document_id: string
  recorded_at: string | null
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

export type PresignedUploadResponse = {
  document_id: string
  upload_url: string
  key: string
  expires_in: number
}

export type ConfirmUploadResponse = {
  document_id: string
  processing_status: string
  // ocr_text: string
  file_size: number
}

export type BatchConfirmUploadResponse = {
  documents: ConfirmUploadResponse[]
  failed: Array<{
    document_id?: string
    reason?: string
    error?: string
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

export type AnalysisResultListItem = {
  id: string
  user_id: string
  category: string
  risk_level: AnalysisRiskLevel
  title: string
  description: string
  confidence: number
  created_at: string
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

export type DoctorSearchRequest = {
  analysis_result_id?: string
  specialty_override?: string
  location: string
  availability: string
}

export type DoctorResult = {
  name: string
  specialty: string
  address: string
  distance_km: number | null
  rating: number | null
  user_ratings_total: number | null
  phone: string | null
  maps_url: string | null
}

export type DoctorSearchResponse = {
  specialty: string
  availability: string
  doctors: DoctorResult[]
  message: string | null
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

export type ConversationSummary = {
  title: string
  session_id: string
  updated_at: string
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

export type MedicalRecordType =
  | 'ALLERGY'
  | 'MEDICATION'
  | 'LAB_RESULT'
  | 'VACCINATION'
  | 'SURGERY'
  | 'DIAGNOSIS'
  | 'CONDITION'
  | 'PROCEDURE'
  | 'FAMILY_HISTORY'

export type MedicalRecordStatus =
  | 'needs_review'
  | 'user_edited'
  | 'verified'
  | 'rejected'
  | 'conflict_requires_review'
  | 'processing'
  | 'extracted'

export type MedicalRecord = {
  id: string
  record_type: MedicalRecordType | string
  status: MedicalRecordStatus
  data: Record<string, unknown>
  document_id: string | null
  recorded_at: string | null
  current_version: number
  conflict_with_record_id: string | null
  created_at: string
  updated_at: string
}

export type MedicalRecordListItem = MedicalRecord

export type GroupedMedicalRecords = {
  record_type: string
  record_type_name: string
  records: MedicalRecord[]
}

export type IntakeStatus = 'awaiting_clarification' | 'awaiting_confirmation' | 'completed' | 'abandoned'

export type RecordIntakeResponse = {
  id: string
  status: IntakeStatus
  record_type: string | null
  record_type_name: string | null
  is_new_record_type: boolean
  data: Record<string, unknown>
  missing_fields: string[]
  pending_question: string | null
  questions_asked: number
  recorded_at: string | null
  resulting_record_id: string | null
  created_at: string
  updated_at: string
}

export type RecordTypeDefinition = {
  id: string
  code: string
  name: string
  description: string
  json_schema: Record<string, unknown>
  is_active: boolean
}

export type UserProfile = {
  id: string
  email: string
  full_name: string
  age: number | null
  height: number | null
  weight: number | null
  blood_group: string | null
  pressure: string | null
  blood_sugar: number | null
}

export type TimelineEntry = {
  name: string | null
  date: string
  category: string
}

export type ApiValidationErrorItem = {
  loc?: Array<string | number>
  msg: string
}

export type ApiErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
  detail?: string | ApiValidationErrorItem[]
}
