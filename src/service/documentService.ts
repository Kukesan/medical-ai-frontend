import type { AuthRequest } from '../context/auth-request'
import type { ConfirmUploadResponse, DocumentDetails, DocumentItem, PresignedUploadResponse, UploadResult } from '../types/api'

export function uploadDocuments(request: AuthRequest, files: FileList) {
  const formData = new FormData()
  Array.from(files).forEach((file) => {
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

export async function uploadDocumentsViaS3(request: AuthRequest, files: FileList): Promise<UploadResult> {
  const uploaded: UploadResult['uploaded'] = []
  const failed: UploadResult['failed'] = []

  for (const file of Array.from(files)) {
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

      const confirmation = await request<ConfirmUploadResponse>(
        `/documents/s3/${presigned.document_id}/confirm-upload`,
        { method: 'POST' },
      )

      uploaded.push({
        file_name: file.name,
        document_id: confirmation.document_id,
        status: confirmation.processing_status,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Upload failed'
      failed.push({ file_name: file.name, reason })
    }
  }

  return { uploaded, failed }
}

export function listDocuments(request: AuthRequest) {
  return request<DocumentItem[]>('/documents')
}

export function getDocumentById(request: AuthRequest, documentId: string) {
  return request<DocumentDetails>(`/documents/${documentId}`)
}