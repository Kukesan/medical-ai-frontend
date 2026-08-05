import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getDocumentById } from '../service/documentService'
import type { DocumentDetails } from '../types/api'

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

function renderValue(value: string | null) {
  return value && value.trim() ? value : '-'
}

export function DocumentDetailsPage() {
  const { request } = useAuth()
  const { documentId } = useParams<{ documentId: string }>()

  const [details, setDetails] = useState<DocumentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')

  const loadDetails = useCallback(async () => {
    if (!documentId) {
      setStatus('Document id is missing.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setStatus('')

    try {
      const response = await getDocumentById(request, documentId)
      setDetails(response)
    } catch (error) {
      setDetails(null)
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load document details')
      }
    } finally {
      setIsLoading(false)
    }
  }, [documentId, request])

  useEffect(() => {
    void loadDetails()
  }, [loadDetails])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Details</h1>
            {documentId ? <p className="mt-1 text-xs text-gray-500">ID: {documentId}</p> : null}
          </div>
          <Link
            to="/document"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#AA1C41] hover:text-[#AA1C41]"
          >
            Back to Documents
          </Link>
        </div>

        {isLoading ? <p className="mt-5 text-sm text-gray-600">Loading document details...</p> : null}
        {status ? <p className="mt-5 text-sm text-red-700">{status}</p> : null}

        {!isLoading && !status && details ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">File Name:</span> {details.file_name}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">MIME Type:</span> {details.mime_type}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">File Size:</span> {formatBytes(details.file_size)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Document Type:</span> {details.document_type}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Processing Status:</span> {details.processing_status}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Created:</span> {formatDate(details.created_at)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Visit Date:</span> {renderValue(details.visit_date)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Doctor:</span> {renderValue(details.doctor_name)}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Hospital:</span> {renderValue(details.hospital_name)}
              </p>
              <p className="text-sm text-gray-700 sm:col-span-2 lg:col-span-3">
                <span className="font-semibold text-gray-900">Diagnosis:</span> {renderValue(details.diagnosis_text)}
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-base font-semibold text-gray-900">Medications</h2>
              {details.medications.length === 0 ? (
                <p className="text-sm text-gray-600">No medications extracted.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Dosage</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Frequency</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Duration</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Start Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">End Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {details.medications.map((medication, index) => (
                        <tr key={`${medication.name}-${index}`}>
                          <td className="px-3 py-2 text-gray-900">{medication.name}</td>
                          <td className="px-3 py-2 text-gray-700">{renderValue(medication.dosage)}</td>
                          <td className="px-3 py-2 text-gray-700">{renderValue(medication.frequency)}</td>
                          <td className="px-3 py-2 text-gray-700">{renderValue(medication.duration)}</td>
                          <td className="px-3 py-2 text-gray-700">{renderValue(medication.start_date)}</td>
                          <td className="px-3 py-2 text-gray-700">{renderValue(medication.end_date)}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {medication.confidence === null ? '-' : `${Math.round(medication.confidence * 100)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-base font-semibold text-gray-900">Lab Results</h2>
              {details.lab_results.length === 0 ? (
                <p className="text-sm text-gray-600">No lab results extracted.</p>
              ) : (
                <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800">
                  {JSON.stringify(details.lab_results, null, 2)}
                </pre>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-base font-semibold text-gray-900">Clinical Notes</h2>
              {details.clinical_notes.length === 0 ? (
                <p className="text-sm text-gray-600">No clinical notes extracted.</p>
              ) : (
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                  {details.clinical_notes.map((note, index) => (
                    <li key={`${note}-${index}`}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
