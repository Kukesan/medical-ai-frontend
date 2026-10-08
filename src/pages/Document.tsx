import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { FileText, Trash2, UploadCloud, X } from 'lucide-react'
import { describeError } from '../lib/describeError'
import { useAuth } from '../context/useAuth'
import {
  MAX_UPLOAD_MB,
  UPLOAD_ACCEPT,
  deleteDocument,
  listDocuments,
  uploadDocumentsViaS3,
  validateUploadFile,
} from '../service/documentService'
import type { DocumentItem, UploadResult } from '../types/api'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DocumentStatusBadge,
  EmptyState,
  PageHeader,
  SkeletonLines,
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

const MAX_FILES = 5
/** Statuses where the backend is still working on the document, so the list should keep refreshing. */
const PROCESSING_STATUSES = new Set(['uploaded', 'ocr_completed'])
const POLL_INTERVAL_MS = 5000

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingDeleteDocument, setPendingDeleteDocument] = useState<DocumentItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  /** `silent` refreshes (background polling) skip the loading skeleton. */
  const loadDocuments = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setIsLoadingDocuments(true)
      }
      try {
        const list = await listDocuments(request)
        setDocuments(list)
        if (!silent) {
          setStatus('')
        }
      } catch (error) {
        if (!silent) {
          setStatus(describeError(error, 'Unable to load documents'))
        }
      } finally {
        if (!silent) {
          setIsLoadingDocuments(false)
        }
      }
    },
    [request],
  )

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  // Keep statuses current while documents are being processed, instead of making the user click Refresh.
  const hasProcessingDocuments = documents.some((doc) => PROCESSING_STATUSES.has(doc.processing_status))
  useEffect(() => {
    if (!hasProcessingDocuments) {
      return
    }
    const timer = window.setInterval(() => void loadDocuments({ silent: true }), POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [hasProcessingDocuments, loadDocuments])

  const addFiles = useCallback(
    (chosen: File[]) => {
      if (chosen.length === 0) {
        return
      }

      const problems: string[] = []
      const valid = chosen.filter((file) => {
        const reason = validateUploadFile(file)
        if (reason) {
          problems.push(`${file.name}: ${reason}`)
        }
        return !reason
      })

      let combined = [...selectedFiles, ...valid]
      if (combined.length > MAX_FILES) {
        combined = combined.slice(0, MAX_FILES)
        problems.push(`You can upload up to ${MAX_FILES} files at once. Only the first ${MAX_FILES} were kept.`)
      }

      setSelectedFiles(combined)
      setStatus(problems.length > 0 ? describeError(new Error(problems.join(' '))) : '')
    },
    [selectedFiles],
  )

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const chosen = Array.from(event.target.files ?? [])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      addFiles(chosen)
    },
    [addFiles],
  )

  const onDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setIsDragging(false)
      addFiles(Array.from(event.dataTransfer.files))
    },
    [addFiles],
  )

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const onUpload = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (selectedFiles.length === 0) {
        setStatus('Please choose at least one file to upload.')
        return
      }

      setIsUploading(true)
      setStatus('')
      setUploadResult(null)

      try {
        const result = await uploadDocumentsViaS3(request, selectedFiles)
        setUploadResult(result)
        setStatus('')

        setSelectedFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        await loadDocuments()
      } catch (error) {
        setStatus(describeError(error, 'Upload failed'))
      } finally {
        setIsUploading(false)
      }
    },
    [loadDocuments, request, selectedFiles],
  )

  const confirmDeleteDocument = useCallback(async () => {
    if (!pendingDeleteDocument) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteDocument(request, pendingDeleteDocument.id)
      setPendingDeleteDocument(null)
      await loadDocuments()
    } catch (error) {
      setStatus(describeError(error, 'Failed to delete document'))
    } finally {
      setIsDeleting(false)
    }
  }, [loadDocuments, pendingDeleteDocument, request])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Upload Documents"
        description="Add prescriptions, lab reports and discharge notes. We'll extract the key details for you to review."
      />

      <Card>
        <form className="flex flex-col gap-4" onSubmit={onUpload}>
          <label
            htmlFor="document-files"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              isDragging && 'border-primary-500 bg-primary-50/60',
              'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-6 py-10 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/40 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10',
            )}
          >
            <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-600 shadow-card ring-1 ring-gray-200/80">
              <UploadCloud className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-gray-800">Click to choose files, or drag them here</span>
            <span className="text-xs text-gray-500">
              PDF, PNG or JPEG · up to {MAX_UPLOAD_MB} MB each · {MAX_FILES} files at once
            </span>
            <input
              ref={fileInputRef}
              id="document-files"
              type="file"
              name="files"
              multiple
              accept={UPLOAD_ACCEPT}
              className="sr-only"
              onChange={onFileChange}
            />
          </label>

          {selectedFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-gray-200 bg-white py-1 pl-2.5 pr-1 text-xs font-medium text-gray-700"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-gray-400">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

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
          <Alert tone="success" className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Upload complete. Your documents are being processed; their status below updates automatically. Once
                they show Pending Review, open each one to check the extracted details.
              </span>
              <Button size="sm" onClick={() => void navigate('/analyze')}>
                Go to Analyze
              </Button>
            </div>
          </Alert>
        ) : null}

        {uploadResult && uploadResult.failed.length > 0 ? (
          <Alert tone="warning" className="mt-4">
            <p className="font-semibold">Some files failed to upload:</p>
            <ul className="mt-1 list-inside list-disc">
              {uploadResult.failed.map((item) => (
                <li key={`${item.file_name}-${item.reason}`}>
                  {item.file_name}: {item.reason}
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900">Uploaded Documents</h2>
          <Badge tone="neutral">{documents.length} total</Badge>
        </div>

        {isLoadingDocuments ? (
          <SkeletonLines count={4} />
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
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {documents.map((doc) => (
                <Tr key={doc.id}>
                  <Td>
                    <button
                      type="button"
                      onClick={() => void navigate(`/document/${doc.id}`)}
                      className="text-left font-medium text-gray-900 underline-offset-2 transition-colors hover:text-primary-700 hover:underline"
                    >
                      {doc.file_name}
                    </button>
                  </Td>
                  <Td className="text-gray-500">{doc.document_type}</Td>
                  <Td className="whitespace-nowrap text-gray-500">{formatBytes(doc.file_size)}</Td>
                  <Td>
                    <DocumentStatusBadge status={doc.processing_status} />
                  </Td>
                  <Td className="whitespace-nowrap text-gray-500">{formatDate(doc.created_at)}</Td>
                  <Td className="text-right">
                    <Button variant="danger" size="sm" onClick={() => setPendingDeleteDocument(doc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDeleteDocument !== null}
        title="Delete this document?"
        description={
          pendingDeleteDocument
            ? `"${pendingDeleteDocument.file_name}" will be permanently deleted. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        isLoading={isDeleting}
        onCancel={() => setPendingDeleteDocument(null)}
        onConfirm={() => void confirmDeleteDocument()}
      />
    </div>
  )
}
