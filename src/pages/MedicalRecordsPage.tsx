import { useState } from 'react'
import { ChevronDown, ClipboardList, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGroupedMedicalRecords } from '../hooks/useGroupedMedicalRecords'
import { useAuth } from '../context/useAuth'
import { updateMedicalRecord } from '../service/medicalRecordService'
import { ApiRequestError } from '../lib/ApiRequestError'
import type { MedicalRecord } from '../types/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Checkbox,
  PageHeader,
  RecordStatusBadge,
  SkeletonLines,
  inferStatusTone,
} from '../components/ui'
import { cn } from '../lib/cn'

function formatLabel(key: string) {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function describeError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return `Error ${error.status}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

type EditRecordModalProps = {
  record: MedicalRecord
  onClose: () => void
  onSaved: () => void
}

function EditRecordModal({ record, onClose, onSaved }: EditRecordModalProps) {
  const { request } = useAuth()
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {}
    Object.entries(record.data).forEach(([key, value]) => {
      initial[key] = typeof value === 'boolean' ? value : formatValue(value) === '-' ? '' : String(value)
    })
    return initial
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {}
      Object.entries(values).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          payload[key] = value
        } else {
          payload[key] = value.trim() === '' ? null : value
        }
      })
      await updateMedicalRecord(request, record.id, payload)
      onSaved()
    } catch (err) {
      setError(describeError(err, 'Unable to update record'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-record-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg animate-fade-in rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="edit-record-title" className="text-lg font-semibold text-gray-900">
          Edit Record
        </h2>
        {error ? (
          <Alert tone="danger" className="mt-3">
            {error}
          </Alert>
        ) : null}
        <div className="mt-4 flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
          {Object.entries(values).map(([key, value]) => (
            <Field key={key} label={formatLabel(key)} htmlFor={`edit-${record.id}-${key}`}>
              {typeof value === 'boolean' ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-${record.id}-${key}`}
                    checked={value}
                    onChange={(event) => setValues((prev) => ({ ...prev, [key]: event.target.checked }))}
                  />
                </div>
              ) : (
                <Input
                  id={`edit-${record.id}-${key}`}
                  value={value}
                  onChange={(event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))}
                />
              )}
            </Field>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function RecordCard({ record, onEdit }: { record: MedicalRecord; onEdit: (record: MedicalRecord) => void }) {
  const entries = Object.entries(record.data)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">Recorded {formatDate(record.recorded_at)}</span>
        <div className="flex items-center gap-2">
          {/* <RecordStatusBadge status={record.status} /> */}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
            onClick={() => onEdit(record)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {record.source_document_id ? 'View Source' : 'Edit'}
          </button>
        </div>
      </div>
      {entries.length > 0 ? (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{formatLabel(key)}</dt>
              <dd className="text-sm text-gray-800">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-gray-400">No additional details.</p>
      )}
    </div>
  )
}

export function MedicalRecordsPage() {
  const { groups, isLoading, status, reload } = useGroupedMedicalRecords()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const navigate = useNavigate()

  const toggleGroup = (recordType: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(recordType)) {
        next.delete(recordType)
      } else {
        next.add(recordType)
      }
      return next
    })
  }

  const handleEdit = (record: MedicalRecord) => {
    if (record.source_document_id) {
      navigate(`/document/${record.source_document_id}`)
      return
    }
    setEditingRecord(record)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Medical Records"
        description="All medical records extracted from your documents, grouped by type."
      />

      {status ? <Alert tone={inferStatusTone(status)}>{status}</Alert> : null}

      {isLoading ? (
        <Card>
          <SkeletonLines count={4} />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No medical records found."
            description="Records extracted from uploaded documents will appear here, grouped by type."
            action={
              <button
                type="button"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                onClick={() => void reload()}
              >
                Refresh
              </button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const isOpen = expanded.has(group.record_type)
            return (
              <Card key={group.record_type} padded={false}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
                  onClick={() => toggleGroup(group.record_type)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-gray-900">{group.record_type_name}</span>
                    <Badge tone="neutral">{group.records.length}</Badge>
                  </div>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                {isOpen ? (
                  <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
                    {group.records.length === 0 ? (
                      <p className="text-sm text-gray-400">No records in this group.</p>
                    ) : (
                      group.records.map((record) => (
                        <RecordCard key={record.id} record={record} onEdit={handleEdit} />
                      ))
                    )}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}

      {editingRecord ? (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => {
            setEditingRecord(null)
            void reload()
          }}
        />
      ) : null}
    </div>
  )
}
