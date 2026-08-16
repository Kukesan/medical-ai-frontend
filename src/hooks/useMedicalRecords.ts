import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { ApiRequestError } from '../lib/ApiRequestError'
import {
  listMedicalRecords,
  rejectMedicalRecord,
  resolveMedicalRecordConflict,
  updateMedicalRecord,
  verifyMedicalRecord,
} from '../service/medicalRecordService'
import type { ConflictResolution } from '../service/medicalRecordService'
import type { MedicalRecord, MedicalRecordType } from '../types/api'

function describeError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return `Error ${error.status}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export function useMedicalRecords(recordType: MedicalRecordType) {
  const { request } = useAuth()

  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await listMedicalRecords(request, { recordType })
      setRecords(list)
      setStatus('')
    } catch (error) {
      setStatus(describeError(error, 'Unable to load records'))
    } finally {
      setIsLoading(false)
    }
  }, [recordType, request])

  useEffect(() => {
    void reload()
  }, [reload])

  const runAction = useCallback(
    async (recordId: string, action: () => Promise<unknown>, successMessage: string, failureFallback: string) => {
      setBusyId(recordId)
      try {
        await action()
        setStatus(successMessage)
        await reload()
        return true
      } catch (error) {
        setStatus(describeError(error, failureFallback))
        return false
      } finally {
        setBusyId(null)
      }
    },
    [reload],
  )

  const save = useCallback(
    (recordId: string, data: Record<string, unknown>) =>
      runAction(
        recordId,
        () => updateMedicalRecord(request, recordId, data),
        'Record updated successfully.',
        'Unable to update record',
      ),
    [request, runAction],
  )

  const verify = useCallback(
    (recordId: string) =>
      runAction(recordId, () => verifyMedicalRecord(request, recordId), 'Record verified.', 'Unable to verify record'),
    [request, runAction],
  )

  const reject = useCallback(
    (recordId: string) =>
      runAction(recordId, () => rejectMedicalRecord(request, recordId), 'Record rejected.', 'Unable to reject record'),
    [request, runAction],
  )

  const resolveConflict = useCallback(
    (recordId: string, resolution: ConflictResolution) =>
      runAction(
        recordId,
        () => resolveMedicalRecordConflict(request, recordId, resolution),
        'Conflict resolved.',
        'Unable to resolve conflict',
      ),
    [request, runAction],
  )

  return { records, isLoading, status, busyId, reload, save, verify, reject, resolveConflict }
}
