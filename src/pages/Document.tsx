import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { listDocuments, uploadDocuments } from '../service/documentService'
import type { DocumentItem, UploadResult } from '../types/api'
import { useNavigate } from 'react-router-dom'

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
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Upload</h1>
        <p className="mt-2 text-sm text-gray-600">Upload one or more medical documents using the secure API endpoint.</p>

        <form className="mt-5 flex flex-col gap-4" onSubmit={onUpload}>
          <input
            ref={fileInputRef}
            type="file"
            name="files"
            multiple
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-[#AA1C41] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#8C1636]"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-lg bg-[#AA1C41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8C1636] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? 'Uploading...' : 'Upload Documents'}
            </button>
            <button
              type="button"
              onClick={() => void loadDocuments()}
              disabled={isLoadingDocuments}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#AA1C41] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingDocuments ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>
        </form>

        {status ? <p className="mt-4 text-sm text-gray-700">{status}</p> : null}

        {uploadResult && uploadResult.uploaded.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span>You can view the analysis report for your uploaded documents on the Analyze page.</span>
            <button
              type="button"
              onClick={() => void navigate('/analyze')}
              className="shrink-0 rounded-lg bg-[#AA1C41] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#8C1636]"
            >
              Go to Analyze
            </button>
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
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Uploaded Documents</h2>
          <p className="text-sm text-gray-600">{documents.length} total</p>
        </div>

        {isLoadingDocuments ? <p className="text-sm text-gray-600">Loading documents...</p> : null}

        {!isLoadingDocuments && documents.length === 0 ? (
          <p className="text-sm text-gray-600">No documents uploaded yet.</p>
        ) : null}

        {!isLoadingDocuments && documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">File Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Size</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      <button
                        type="button"
                        onClick={() => void navigate(`/document/${doc.id}`)}
                        className="text-left font-medium text-[#AA1C41] underline-offset-2 hover:underline"
                      >
                        {doc.file_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{doc.document_type}</td>
                    <td className="px-4 py-3 text-gray-700">{formatBytes(doc.file_size)}</td>
                    <td className="px-4 py-3 text-gray-700">{doc.processing_status}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}