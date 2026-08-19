import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Pencil } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { acceptDocument, getDocument, updateDocumentExtraction } from '../service/documentService'
import type { DocumentDetails } from '../types/api'
import { Alert, Button, Card, DocumentStatusBadge, LoadingRow, buttonClassName, inferStatusTone } from '../components/ui'
import { ExtractionEditor } from '../components/document/ExtractionEditor'
import type { JsonValue } from '../components/document/jsonValue'

const NOT_YET_EXTRACTED = new Set(['uploaded', 'ocr_completed', 'failed'])

function describeError(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    return `Error ${error.status}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function DocumentDetailsPage() {
  const { request } = useAuth()
  const { documentId } = useParams<{ documentId: string }>()

  const [doc, setDoc] = useState<DocumentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<{ [key: string]: JsonValue }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  const loadDetails = useCallback(async () => {
    if (!documentId) {
      setStatus('Document id is missing.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setStatus('')

    try {
      const response = await getDocument(request, documentId)
      setDoc(response)
    } catch (error) {
      setDoc(null)
      setStatus(describeError(error, 'Unable to load document details'))
    } finally {
      setIsLoading(false)
    }
  }, [documentId, request])

  useEffect(() => {
    void loadDetails()
  }, [loadDetails])

  const startEdit = useCallback(() => {
    if (!doc) return
    setEditValue((doc.extraction_result as { [key: string]: JsonValue } | null) ?? {})
    setIsEditing(true)
    setStatus('')
  }, [doc])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditValue({})
  }, [])

  const submitEdit = useCallback(async () => {
    if (!documentId) return

    setIsSaving(true)
    setStatus('')

    try {
      const response = await updateDocumentExtraction(request, documentId, editValue)
      setDoc(response)
      setIsEditing(false)
      setEditValue({})
      setStatus('Extracted data saved.')
    } catch (error) {
      setStatus(describeError(error, 'Unable to save extracted data'))
    } finally {
      setIsSaving(false)
    }
  }, [documentId, editValue, request])

  const accept = useCallback(async () => {
    if (!documentId) return

    setIsAccepting(true)
    setStatus('')

    try {
      const response = await acceptDocument(request, documentId)
      setDoc(response)
      setStatus('Document accepted.')
    } catch (error) {
      setStatus(describeError(error, 'Unable to accept document'))
    } finally {
      setIsAccepting(false)
    }
  }, [documentId, request])

  const canReview = doc ? !NOT_YET_EXTRACTED.has(doc.processing_status) : false
  const canAccept = canReview && doc?.processing_status !== 'accepted'

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{doc?.file_name ?? 'Document Details'}</h1>
            {documentId ? <p className="mt-1 text-xs text-gray-500">ID: {documentId}</p> : null}
          </div>
          <Link to="/document" className={buttonClassName('secondary', 'md', 'inline-flex items-center gap-2')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>
        </div>

        {isLoading ? <LoadingRow label="Loading document details..." /> : null}
        {status ? (
          <Alert tone={inferStatusTone(status)} className="mt-5">
            {status}
          </Alert>
        ) : null}

        {!isLoading && doc ? (
          <table className="mt-5 w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <th className="w-40 py-2 pr-4 text-left font-medium text-gray-500">Status</th>
                <td className="py-2">
                  <DocumentStatusBadge status={doc.processing_status} />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="py-2 pr-4 text-left font-medium text-gray-500">Document type</th>
                <td className="py-2 text-gray-900">{doc.document_type}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="py-2 pr-4 text-left font-medium text-gray-500">Uploaded</th>
                <td className="py-2 text-gray-900">{formatDateTime(doc.created_at)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="py-2 pr-4 text-left font-medium text-gray-500">Visit date</th>
                <td className="py-2 text-gray-900">{doc.visit_date ?? '—'}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="py-2 pr-4 text-left font-medium text-gray-500">Doctor</th>
                <td className="py-2 text-gray-900">{doc.doctor_name ?? '—'}</td>
              </tr>
              <tr>
                <th className="py-2 pr-4 text-left font-medium text-gray-500">Hospital</th>
                <td className="py-2 text-gray-900">{doc.hospital_name ?? '—'}</td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </Card>

      {!isLoading && doc ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Extracted Data</h2>

            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={startEdit}
                  disabled={!canReview}
                  className="inline-flex items-center gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {canAccept ? (
                  <Button size="sm" onClick={() => void accept()} isLoading={isAccepting} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={isSaving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => void submitEdit()} isLoading={isSaving}>
                  Save
                </Button>
              </div>
            )}
          </div>

          {!canReview && !isEditing ? (
            <p className="mt-3 text-sm text-gray-500">Extraction has not completed yet — data will appear here once processing finishes.</p>
          ) : null}

          <div className="mt-4">
            {isEditing ? (
              <ExtractionEditor data={editValue} editable onChange={setEditValue} />
            ) : (
              <ExtractionEditor
                data={doc.extraction_result as { [key: string]: JsonValue } | null}
                editable={false}
                onChange={() => {}}
              />
            )}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
