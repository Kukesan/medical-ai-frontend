import type { DocumentRecordItem, MedicalRecord } from '../types/api'

/**
 * Document-extracted records have no review workflow of their own (editing happens
 * on the source document), so they're displayed as already-verified, read-only
 * MedicalRecord entries with a synthetic id and source_document_id pointing back
 * at the document - the existing UI already treats that combination as "view source only".
 */
export function documentRecordToMedicalRecord(record: DocumentRecordItem, index: number): MedicalRecord {
  const timestamp = record.recorded_at ?? new Date(0).toISOString()
  return {
    id: `document-${record.document_id}-${index}`,
    record_type: record.record_type,
    status: 'verified',
    data: record.data,
    document_id: record.document_id,
    recorded_at: record.recorded_at,
    current_version: 1,
    conflict_with_record_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  }
}
