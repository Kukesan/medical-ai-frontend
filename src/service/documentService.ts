import type { AuthRequest, AuthTextRequest } from '../context/auth-request'
import type { BatchConfirmUploadResponse, DocumentItem, PresignedUploadResponse, UploadResult } from '../types/api'

export function uploadDocuments(request: AuthRequest, files: File[]) {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  return request<UploadResult>('/documents/upload', {
    method: 'POST',
    body: formData,
  })
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
    const body = await response.text().catch(() => '')
    console.error(`S3 upload failed for ${file.name}`, response.status, body)
    throw new Error(`Failed to upload ${file.name} to storage (status ${response.status})`)
  }
}

export async function uploadDocumentsViaS3(request: AuthRequest, files: File[]): Promise<UploadResult> {
  const failed: UploadResult['failed'] = []
  const pending: Array<{ file_name: string; document_id: string }> = []

  for (const file of files) {
    try {
      const presigned = await request<PresignedUploadResponse>('/documents/s3/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          file_name: file.name,
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size,
        }),
      })

      await putFileToS3(presigned.upload_url, file)

      pending.push({ file_name: file.name, document_id: presigned.document_id })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Upload failed'
      failed.push({ file_name: file.name, reason })
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

    const settledIds = new Set(response.documents.map((doc) => doc.document_id))

    response.failed.forEach((item) => {
      settledIds.add(item.document_id ?? '')
      failed.push({
        file_name: pending.find((entry) => entry.document_id === item.document_id)?.file_name ?? item.document_id ?? 'Unknown file',
        reason: item.reason ?? item.error ?? 'Failed to confirm upload',
      })
    })

    pending
      .filter((item) => !settledIds.has(item.document_id))
      .forEach((item) => failed.push({ file_name: item.file_name, reason: 'Failed to confirm upload' }))

    return { uploaded, failed }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Failed to confirm upload'
    pending.forEach((item) => failed.push({ file_name: item.file_name, reason }))
    return { uploaded: [], failed }
  }
}

export function listDocuments(request: AuthRequest) {
  return request<DocumentItem[]>('/documents')
}

export function getDocumentHtml(requestText: AuthTextRequest, documentId: string) {
  return requestText(`/documents/${documentId}`)
}