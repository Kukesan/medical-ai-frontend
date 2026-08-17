import { useState } from 'react'
import { ChevronDown, ClipboardList } from 'lucide-react'
import { useGroupedMedicalRecords } from '../hooks/useGroupedMedicalRecords'
import type { MedicalRecord } from '../types/api'
import { Alert, Badge, Card, EmptyState, PageHeader, RecordStatusBadge, SkeletonLines, inferStatusTone } from '../components/ui'
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

function RecordCard({ record }: { record: MedicalRecord }) {
  const entries = Object.entries(record.data)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">Recorded {formatDate(record.recorded_at)}</span>
        <RecordStatusBadge status={record.status} />
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
                      group.records.map((record) => <RecordCard key={record.id} record={record} />)
                    )}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
