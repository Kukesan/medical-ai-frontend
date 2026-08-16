import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getDocumentById } from '../service/documentService'
import type { DocumentDetails } from '../types/api'
import {
  Alert,
  Card,
  LoadingRow,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  buttonClassName,
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

function renderValue(value: string | null) {
  return value && value.trim() ? value : '-'
}

function DetailItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <p className={className}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="mt-0.5 block text-sm text-gray-800">{value}</span>
    </p>
  )
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
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Details</h1>
            {documentId ? <p className="mt-1 text-xs text-gray-500">ID: {documentId}</p> : null}
          </div>
          <Link to="/document" className={buttonClassName('secondary', 'md', 'inline-flex items-center gap-2')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>
        </div>

        {isLoading ? <LoadingRow label="Loading document details..." /> : null}
        {status ? (
          <Alert tone="danger" className="mt-5">
            {status}
          </Alert>
        ) : null}

        {!isLoading && !status && details ? (
          <div className="mt-5 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="File Name" value={details.file_name} />
              <DetailItem label="MIME Type" value={details.mime_type} />
              <DetailItem label="File Size" value={formatBytes(details.file_size)} />
              <DetailItem label="Document Type" value={details.document_type} />
              <DetailItem label="Processing Status" value={details.processing_status} />
              <DetailItem label="Created" value={formatDate(details.created_at)} />
              <DetailItem label="Visit Date" value={renderValue(details.visit_date)} />
              <DetailItem label="Doctor" value={renderValue(details.doctor_name)} />
              <DetailItem label="Hospital" value={renderValue(details.hospital_name)} />
              <DetailItem
                label="Diagnosis"
                value={renderValue(details.diagnosis_text)}
                className="sm:col-span-2 lg:col-span-3"
              />
            </div>

            <div>
              <h2 className="mb-2 text-base font-semibold text-gray-900">Medications</h2>
              {details.medications.length === 0 ? (
                <p className="text-sm text-gray-600">No medications extracted.</p>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Dosage</Th>
                      <Th>Frequency</Th>
                      <Th>Duration</Th>
                      <Th>Start Date</Th>
                      <Th>End Date</Th>
                      <Th>Confidence</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {details.medications.map((medication, index) => (
                      <Tr key={`${medication.name}-${index}`}>
                        <Td className="font-medium text-gray-900">{medication.name}</Td>
                        <Td>{renderValue(medication.dosage)}</Td>
                        <Td>{renderValue(medication.frequency)}</Td>
                        <Td>{renderValue(medication.duration)}</Td>
                        <Td>{renderValue(medication.start_date)}</Td>
                        <Td>{renderValue(medication.end_date)}</Td>
                        <Td>
                          {medication.confidence === null ? '-' : `${Math.round(medication.confidence * 100)}%`}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
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
          </div>
        ) : null}
      </Card>
    </div>
  )
}
