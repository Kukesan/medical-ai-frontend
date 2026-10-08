import { useEffect, useState } from 'react'
import { ChevronDown, ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGroupedMedicalRecords } from '../hooks/useGroupedMedicalRecords'
import { useAuth } from '../context/useAuth'
import { getMedicalRecord, updateMedicalRecord } from '../service/medicalRecordService'
import { describeError } from '../lib/describeError'
import type { MedicalRecord } from '../types/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Checkbox,
  LoadingRow,
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


type EditRecordModalProps = {
  record: MedicalRecord
  onClose: () => void
  onSaved: () => void
}

function toEditValues(data: Record<string, unknown>): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {}
  Object.entries(data).forEach(([key, value]) => {
    values[key] = typeof value === 'boolean' ? value : formatValue(value) === '-' ? '' : String(value)
  })
  return values
}

function EditRecordModal({ record, onClose, onSaved }: EditRecordModalProps) {
  const { request } = useAuth()
  const [values, setValues] = useState<Record<string, string | boolean>>(() => toEditValues(record.data))
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getMedicalRecord(request, record.id)
      .then((fresh) => {
        if (!cancelled) {
          setValues(toEditValues(fresh.data))
        }
      })
      .catch(() => {
        // Fall back to the record data already in hand.
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [record.id, request])

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-record-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg animate-fade-in rounded-xl bg-white p-6 shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="edit-record-title" className="text-base font-semibold text-gray-900">
          Edit Record
        </h2>
        {error ? (
          <Alert tone="danger" className="mt-3">
            {error}
          </Alert>
        ) : null}
        {isLoading ? (
          <div className="mt-4">
            <LoadingRow label="Loading latest record..." />
          </div>
        ) : (
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
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} isLoading={isSaving} disabled={isLoading}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function RecordCard({
  record,
  onEdit,
  onVerify,
  onDelete,
  isVerifying,
}: {
  record: MedicalRecord
  onEdit: (record: MedicalRecord) => void
  onVerify: (record: MedicalRecord) => void
  onDelete: (record: MedicalRecord) => void
  isVerifying: boolean
}) {
  const entries = Object.entries(record.data)
  const canVerify = record.status === 'needs_review' || record.status === 'user_edited'
  const isUserInput = !record.document_id

  return (
    <div className="rounded-lg border border-gray-200/80 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RecordStatusBadge status={record.status} />
          {isUserInput ? <Badge tone="primary">User Input</Badge> : null}
          <span className="text-xs text-gray-500">Recorded {formatDate(record.recorded_at)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canVerify ? (
            <Button size="sm" onClick={() => onVerify(record)} isLoading={isVerifying}>
              Verify
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => onEdit(record)}>
            <Pencil className="h-3.5 w-3.5" />
            {record.document_id ? 'View Source' : 'Edit'}
          </Button>
          {isUserInput ? (
            <Button variant="danger" size="sm" onClick={() => onDelete(record)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>
      {entries.length > 0 ? (
        <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs font-medium text-gray-500">{formatLabel(key)}</dt>
              <dd className="mt-0.5 break-words text-sm text-gray-900">{formatValue(value)}</dd>
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
  const { groups, isLoading, status, busyId, reload, verify, remove } = useGroupedMedicalRecords()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<MedicalRecord | null>(null)
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
    if (record.document_id) {
      navigate(`/document/${record.document_id}`)
      return
    }
    setEditingRecord(record)
  }

  const handleVerify = (record: MedicalRecord) => {
    void verify(record.id)
  }

  const handleDelete = (record: MedicalRecord) => {
    setPendingDeleteRecord(record)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteRecord) {
      return
    }
    await remove(pendingDeleteRecord.id)
    setPendingDeleteRecord(null)
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
              <Button variant="secondary" size="sm" onClick={() => void reload()}>
                Refresh
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const isOpen = expanded.has(group.record_type)
            return (
              <Card key={group.record_type} padded={false} className="overflow-hidden">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/60 sm:px-6"
                  onClick={() => toggleGroup(group.record_type)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{group.record_type_name}</span>
                    <Badge tone="neutral">{group.records.length}</Badge>
                  </div>
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                {isOpen ? (
                  <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:px-6">
                    {group.records.length === 0 ? (
                      <p className="text-sm text-gray-400">No records in this group.</p>
                    ) : (
                      group.records.map((record) => (
                        <RecordCard
                          key={record.id}
                          record={record}
                          onEdit={handleEdit}
                          onVerify={handleVerify}
                          onDelete={handleDelete}
                          isVerifying={busyId === record.id}
                        />
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

      <ConfirmDialog
        open={pendingDeleteRecord !== null}
        title="Delete this record?"
        description="This user-entered record will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        isLoading={pendingDeleteRecord !== null && busyId === pendingDeleteRecord.id}
        onCancel={() => setPendingDeleteRecord(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
