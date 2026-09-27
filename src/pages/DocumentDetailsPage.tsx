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
      <div className="flex flex-col items-start gap-3">
        <Link to="/document" className={buttonClassName('ghost', 'sm', '-ml-2')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight text-gray-900">
            {doc?.file_name ?? 'Document Details'}
          </h1>
          {documentId ? <p className="mt-1 font-mono text-xs text-gray-400">ID: {documentId}</p> : null}
        </div>
      </div>

      <Card>
        {isLoading ? <LoadingRow label="Loading document details..." /> : null}
        {status ? (
          <Alert tone={inferStatusTone(status)} className={isLoading || doc ? 'mb-5' : undefined}>
            {status}
          </Alert>
        ) : null}

        {!isLoading && doc ? (
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <DocumentStatusBadge status={doc.processing_status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Document type</dt>
              <dd className="mt-1 text-sm text-gray-900">{doc.document_type}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Uploaded</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(doc.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Visit date</dt>
              <dd className="mt-1 text-sm text-gray-900">{doc.visit_date ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Doctor</dt>
              <dd className="mt-1 text-sm text-gray-900">{doc.doctor_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Hospital</dt>
              <dd className="mt-1 text-sm text-gray-900">{doc.hospital_name ?? '—'}</dd>
            </div>
          </dl>
        ) : null}
      </Card>

      {!isLoading && doc ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <h2 className="text-base font-semibold text-gray-900">Extracted Data</h2>

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

          <div className="mt-5">
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
