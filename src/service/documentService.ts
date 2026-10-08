import type { AuthRequest, AuthTextRequest } from '../context/auth-request'
import { describeError } from '../lib/describeError'
import type {
  BatchConfirmUploadResponse,
  DocumentDetails,
  DocumentItem,
  DocumentRecordItem,
  PresignedUploadResponse,
  UploadResult,
} from '../types/api'

/** Must match the backend's limits (app/schemas/s3_document.py). */
export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
}
export const UPLOAD_ACCEPT = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'
export const MAX_UPLOAD_MB = 25

/** Returns why a file can't be uploaded, or null if it's fine. */
export function validateUploadFile(file: File): string | null {
  if (!ALLOWED_UPLOAD_TYPES[file.type]) {
    return 'Unsupported file type. Please upload a PDF, PNG or JPEG.'
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `File is larger than ${MAX_UPLOAD_MB} MB.`
  }
  if (file.size === 0) {
    return 'File is empty.'
  }
  return null
}

async function putFileToS3(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error('Upload to storage failed. Please try again.')
  }
}

export async function uploadDocumentsViaS3(request: AuthRequest, files: File[]): Promise<UploadResult> {
  const failed: UploadResult['failed'] = []
  const pending: Array<{ file_name: string; document_id: string }> = []

  for (const file of files) {
    const invalidReason = validateUploadFile(file)
    if (invalidReason) {
      failed.push({ file_name: file.name, reason: invalidReason })
      continue
    }

    let documentId: string | null = null
    try {
      const presigned = await request<PresignedUploadResponse>('/documents/s3/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
        }),
      })
      documentId = presigned.document_id

      await putFileToS3(presigned.upload_url, file)

      pending.push({ file_name: file.name, document_id: presigned.document_id })
    } catch (error) {
      failed.push({ file_name: file.name, reason: describeError(error, 'Upload failed') })
      // The backend already created a record for this file; remove it so it doesn't sit at "uploaded" forever.
      if (documentId) {
        await deleteDocument(request, documentId).catch(() => undefined)
      }
    }
  }

  if (pending.length === 0) {
    return { uploaded: [], failed }
  }

  try {
    const response = await request<BatchConfirmUploadResponse>('/documents/s3/confirm-upload', {
      method: 'POST',
      body: JSON.stringify({ document_ids: pending.map((item) => item.document_id) }),
    })

    const uploaded = response.documents.map((doc) => ({
      file_name: pending.find((item) => item.document_id === doc.document_id)?.file_name ?? doc.document_id,
      document_id: doc.document_id,
      status: doc.processing_status,
    }))

    const confirmedIds = new Set(response.documents.map((doc) => doc.document_id))
    pending
      .filter((item) => !confirmedIds.has(item.document_id))
      .forEach((item) =>
        failed.push({ file_name: item.file_name, reason: 'The file was rejected or did not finish uploading.' }),
      )

    return { uploaded, failed }
  } catch (error) {
    const reason = describeError(error, 'Failed to confirm upload')
    pending.forEach((item) => failed.push({ file_name: item.file_name, reason }))
    return { uploaded: [], failed }
  }
}

export function listDocuments(request: AuthRequest) {
  return request<DocumentItem[]>('/documents')
}

export type ListDocumentRecordsParams = {
  recordType?: string
  documentId?: string
}

export function listDocumentRecords(request: AuthRequest, params: ListDocumentRecordsParams = {}) {
  const query = new URLSearchParams()
  if (params.recordType) query.set('record_type', params.recordType)
  if (params.documentId) query.set('document_id', params.documentId)

  const queryString = query.toString()
  return request<DocumentRecordItem[]>(`/documents/records${queryString ? `?${queryString}` : ''}`)
}

export function getDocumentHtml(requestText: AuthTextRequest, documentId: string) {
  return requestText(`/documents/${documentId}`)
}

export function getDocument(request: AuthRequest, documentId: string) {
  return request<DocumentDetails>(`/documents/${documentId}/detail`)
}

export function updateDocumentExtraction(
  request: AuthRequest,
  documentId: string,
  extractionResult: Record<string, unknown>,
) {
  return request<DocumentDetails>(`/documents/${documentId}/extraction`, {
    method: 'PATCH',
    body: JSON.stringify({ extraction_result: extractionResult }),
  })
}

export function acceptDocument(request: AuthRequest, documentId: string) {
  return request<DocumentDetails>(`/documents/${documentId}/accept`, {
    method: 'POST',
  })
}

export function deleteDocument(request: AuthRequest, documentId: string) {
  return request<void>(`/documents/${documentId}`, {
    method: 'DELETE',
  })
}