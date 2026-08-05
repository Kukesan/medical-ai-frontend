import type { AuthRequest } from '../context/auth-request'
import type { DocumentDetails, DocumentItem, UploadResult } from '../types/api'

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

export function listDocuments(request: AuthRequest) {
  return request<DocumentItem[]>('/documents')
}

export function getDocumentById(request: AuthRequest, documentId: string) {
  return request<DocumentDetails>(`/documents/${documentId}`)
}