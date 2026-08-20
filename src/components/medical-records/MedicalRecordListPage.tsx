import { Fragment, useCallback, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMedicalRecords } from '../../hooks/useMedicalRecords'
import type { MedicalRecord, MedicalRecordType } from '../../types/api'
import {
  Alert,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  RecordStatusBadge,
  SkeletonLines,
  Table,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr,
  inferStatusTone,
} from '../ui'
import { ConflictPanel } from './ConflictPanel'
import { formatFieldValue, toInputValue, toPayloadValue } from './fieldUtils'
import type { RecordFieldConfig } from './fieldUtils'

type EditValues = Record<string, string | boolean>

function initialEditValues(record: MedicalRecord, fields: RecordFieldConfig[]): EditValues {
  const values: EditValues = {}
  fields.forEach((field) => {
    values[field.key] = toInputValue(record.data[field.key], field.type)
  })
  return values
}

type MedicalRecordListPageProps = {
  recordType: MedicalRecordType
  title: string
  description: string
  icon: LucideIcon
  fields: RecordFieldConfig[]
  emptyTitle: string
  emptyDescription: string
}

export function MedicalRecordListPage({
  recordType,
  title,
  description,
  icon,
  fields,
  emptyTitle,
  emptyDescription,
}: MedicalRecordListPageProps) {
  const { records, isLoading, status, busyId, reload, save, verify, reject, resolveConflict } =
    useMedicalRecords(recordType)
  const navigate = useNavigate()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditValues>({})
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null)
  const [expandedConflictId, setExpandedConflictId] = useState<string | null>(null)

  const startEdit = useCallback(
    (record: MedicalRecord) => {
      setEditingId(record.id)
      setEditValues(initialEditValues(record, fields))
    },
    [fields],
  )

  const handleEditClick = useCallback(
    (record: MedicalRecord) => {
      if (record.document_id) {
        navigate(`/document/${record.document_id}`)
        return
      }
      startEdit(record)
    },
    [navigate, startEdit],
  )

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditValues({})
  }, [])

  const submitEdit = useCallback(
    async (recordId: string) => {
      const data: Record<string, unknown> = {}
      fields.forEach((field) => {
        data[field.key] = toPayloadValue(editValues[field.key], field.type)
      })

      const ok = await save(recordId, data)
      if (ok) {
        setEditingId(null)
        setEditValues({})
      }
    },
    [editValues, fields, save],
  )

  const confirmReject = useCallback(async () => {
    if (!pendingRejectId) {
      return
    }
    await reject(pendingRejectId)
    setPendingRejectId(null)
  }, [pendingRejectId, reject])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="secondary" onClick={() => void reload()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh List'}
          </Button>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        {status ? (
          <Alert tone={inferStatusTone(status)} className="mb-4">
            {status}
          </Alert>
        ) : null}

        {isLoading ? (
          <SkeletonLines count={4} />
        ) : records.length === 0 ? (
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
        ) : (
          <Table>
            <Thead>
              <Tr>
                {fields.map((field) => (
                  <Th key={field.key}>{field.label}</Th>
                ))}
                <Th>Status</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {records.map((record) => {
                const isEditing = editingId === record.id
                const isBusy = busyId === record.id
                const isConflict = record.status === 'conflict_requires_review'
                const isRejected = record.status === 'rejected'
                const canVerify = record.status === 'needs_review' || record.status === 'user_edited'

                return (
                  <Fragment key={record.id}>
                    <Tr>
                      {fields.map((field) => (
                        <Td key={field.key}>
                          {isEditing ? (
                            field.type === 'boolean' ? (
                              <Checkbox
                                checked={Boolean(editValues[field.key])}
                                onChange={(event) =>
                                  setEditValues((prev) => ({ ...prev, [field.key]: event.target.checked }))
                                }
                              />
                            ) : field.type === 'textarea' ? (
                              <Textarea
                                value={(editValues[field.key] as string) ?? ''}
                                onChange={(event) =>
                                  setEditValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                                }
                                required={field.required}
                              />
                            ) : (
                              <Input
                                type={field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'}
                                value={(editValues[field.key] as string) ?? ''}
                                onChange={(event) =>
                                  setEditValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                                }
                                required={field.required}
                              />
                            )
                          ) : (
                            formatFieldValue(record.data[field.key], field.type)
                          )}
                        </Td>
                      ))}
                      <Td>
                        <RecordStatusBadge status={record.status} />
                      </Td>
                      <Td className="text-right">
                        {isRejected ? (
                          <span className="text-xs text-gray-400">No actions available</span>
                        ) : isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={isBusy}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => void submitEdit(record.id)} isLoading={isBusy}>
                              Save
                            </Button>
                          </div>
                        ) : isConflict ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setExpandedConflictId((prev) => (prev === record.id ? null : record.id))}
                          >
                            {expandedConflictId === record.id ? 'Hide Conflict' : 'Review Conflict'}
                          </Button>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditClick(record)}
                              disabled={isBusy}
                            >
                              {record.document_id ? 'View Source' : 'Edit'}
                            </Button>
                            {canVerify ? (
                              <>
                                <Button size="sm" onClick={() => void verify(record.id)} isLoading={isBusy}>
                                  Verify
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setPendingRejectId(record.id)}
                                  disabled={isBusy}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}
                          </div>
                        )}
                      </Td>
                    </Tr>
                    {isConflict && expandedConflictId === record.id ? (
                      <Tr>
                        <Td colSpan={fields.length + 2}>
                          <ConflictPanel
                            record={record}
                            fields={fields}
                            isBusy={isBusy}
                            onResolve={(resolution) => void resolveConflict(record.id, resolution)}
                          />
                        </Td>
                      </Tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </Tbody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        open={pendingRejectId !== null}
        title="Reject this record?"
        description="The record will be marked as rejected and removed from your active list."
        confirmLabel="Reject"
        isLoading={busyId !== null && busyId === pendingRejectId}
        onCancel={() => setPendingRejectId(null)}
        onConfirm={() => void confirmReject()}
      />
    </div>
  )
}
