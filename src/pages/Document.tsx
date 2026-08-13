import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { listDocuments, uploadDocuments } from '../service/documentService'
import type { DocumentItem, UploadResult } from '../types/api'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  inferStatusTone,
} from '../components/ui'

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function DocumentPage() {
  const { request } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [status, setStatus] = useState('')
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true)
    try {
      const list = await listDocuments(request)
      setDocuments(list)
      setStatus('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load documents')
      }
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [request])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const onUpload = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const files = fileInputRef.current?.files

      if (!files || files.length === 0) {
        setStatus('Please choose at least one file to upload.')
        return
      }

      setIsUploading(true)
      setStatus('')
      setUploadResult(null)

      try {
        const result = await uploadDocuments(request, files)
        setUploadResult(result)
        const uploadedCount = result.uploaded.length
        const failedCount = result.failed.length
        setStatus(`Upload complete: ${uploadedCount} uploaded, ${failedCount} failed.`)

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        await loadDocuments()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Upload failed')
        }
      } finally {
        setIsUploading(false)
      }
    },
    [loadDocuments, request],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Document Upload" description="Upload one or more medical documents using the secure API endpoint." />

      <Card>
        <form className="flex flex-col gap-4" onSubmit={onUpload}>
          <label
            htmlFor="document-files"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 px-6 py-10 text-center transition hover:border-primary-300 hover:bg-primary-50/40"
          >
            <UploadCloud className="h-8 w-8 text-primary-500" />
            <span className="text-sm font-semibold text-gray-700">Click to choose files, or drag them here</span>
            <span className="text-xs text-gray-500">Supports multiple files at once</span>
            <input ref={fileInputRef} id="document-files" type="file" name="files" multiple className="sr-only" />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Documents'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => void loadDocuments()} isLoading={isLoadingDocuments}>
              {isLoadingDocuments ? 'Refreshing...' : 'Refresh List'}
            </Button>
          </div>
        </form>

        {status ? (
          <Alert tone={inferStatusTone(status)} className="mt-4">
            {status}
          </Alert>
        ) : null}

        {uploadResult && uploadResult.uploaded.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span>You can analyze your uploaded documents on the Analyze page.</span>
            <Button size="sm" onClick={() => void navigate('/analyze')}>
              Go to Analyze
            </Button>
          </div>
        ) : null}

        {uploadResult && uploadResult.failed.length > 0 ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Some files failed to upload:</p>
            <ul className="mt-1 list-inside list-disc">
              {uploadResult.failed.map((item) => (
                <li key={`${item.file_name}-${item.reason}`}>
                  {item.file_name}: {item.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
          <p className="text-sm text-gray-600">{documents.length} total</p>
        </div>

        {isLoadingDocuments ? (
          <p className="text-sm text-gray-600">Loading documents...</p>
        ) : documents.length === 0 ? (
          <EmptyState title="No documents uploaded yet." description="Upload a file above to get started." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>File Name</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </Tr>
            </Thead>
            <Tbody>
              {documents.map((doc) => (
                <Tr key={doc.id}>
                  <Td>
                    <button
                      type="button"
                      onClick={() => void navigate(`/document/${doc.id}`)}
                      className="text-left font-medium text-primary-700 underline-offset-2 hover:underline"
                    >
                      {doc.file_name}
                    </button>
                  </Td>
                  <Td>{doc.document_type}</Td>
                  <Td>{formatBytes(doc.file_size)}</Td>
                  <Td>
                    <Badge tone="neutral">{doc.processing_status}</Badge>
                  </Td>
                  <Td>{formatDate(doc.created_at)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
