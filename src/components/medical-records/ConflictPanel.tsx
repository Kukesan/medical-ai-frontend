import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { getMedicalRecord } from '../../service/medicalRecordService'
import type { MedicalRecord } from '../../types/api'
import { Alert, Button } from '../ui'
import { formatFieldValue } from './fieldUtils'
import type { RecordFieldConfig } from './fieldUtils'

type ConflictPanelProps = {
  record: MedicalRecord
  fields: RecordFieldConfig[]
  isBusy: boolean
  onResolve: (resolution: 'keep_existing' | 'accept_incoming') => void
}

export function ConflictPanel({ record, fields, isBusy, onResolve }: ConflictPanelProps) {
  const { request } = useAuth()
  const [existing, setExisting] = useState<MedicalRecord | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!record.conflict_with_record_id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    getMedicalRecord(request, record.conflict_with_record_id)
      .then((data) => {
        if (!cancelled) {
          setExisting(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load the existing verified record for comparison.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [record.conflict_with_record_id, request])

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-800">
        This extraction conflicts with a previously verified record. Choose which version to keep.
      </p>

      {isLoading ? (
        <p className="mt-2 text-sm text-amber-700">Loading comparison...</p>
      ) : error ? (
        <Alert tone="danger" className="mt-2">
          {error}
        </Alert>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Existing (verified)</p>
            <dl className="mt-1 space-y-1 text-sm text-gray-800">
              {fields.map((field) => (
                <div key={field.key} className="flex justify-between gap-2">
                  <dt className="text-gray-500">{field.label}</dt>
                  <dd>{formatFieldValue(existing?.data[field.key], field.type)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Incoming (new)</p>
            <dl className="mt-1 space-y-1 text-sm text-gray-800">
              {fields.map((field) => (
                <div key={field.key} className="flex justify-between gap-2">
                  <dt className="text-gray-500">{field.label}</dt>
                  <dd>{formatFieldValue(record.data[field.key], field.type)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={() => onResolve('keep_existing')} isLoading={isBusy} disabled={isLoading}>
          Keep Existing
        </Button>
        <Button size="sm" onClick={() => onResolve('accept_incoming')} isLoading={isBusy} disabled={isLoading}>
          Accept Incoming
        </Button>
      </div>
    </div>
  )
}
