import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { ApiRequestError } from '../lib/ApiRequestError'
import { documentRecordToMedicalRecord } from '../lib/documentRecordAdapter'
import { listDocumentRecords } from '../service/documentService'
import {
  deleteMedicalRecord,
  getGroupedMedicalRecords,
  listRecordTypes,
  verifyMedicalRecord,
} from '../service/medicalRecordService'
import type { GroupedMedicalRecords } from '../types/api'

function describeError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    return `Error ${error.status}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export function useGroupedMedicalRecords() {
  const { request } = useAuth()

  const [groups, setGroups] = useState<GroupedMedicalRecords[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const [manualGroups, documentRecords, recordTypes] = await Promise.all([
        getGroupedMedicalRecords(request),
        listDocumentRecords(request),
        listRecordTypes(request).catch(() => []),
      ])

      const nameByCode = new Map(recordTypes.map((recordType) => [recordType.code, recordType.name]))
      const groupByCode = new Map<string, GroupedMedicalRecords>(
        manualGroups.map((group) => [group.record_type, { ...group, records: [...group.records] }]),
      )

      documentRecords.forEach((documentRecord, index) => {
        const displayRecord = documentRecordToMedicalRecord(documentRecord, index)
        const existing = groupByCode.get(documentRecord.record_type)
        if (existing) {
          existing.records.push(displayRecord)
        } else {
          groupByCode.set(documentRecord.record_type, {
            record_type: documentRecord.record_type,
            record_type_name: nameByCode.get(documentRecord.record_type) ?? documentRecord.record_type,
            records: [displayRecord],
          })
        }
      })

      setGroups(Array.from(groupByCode.values()))
      setStatus('')
    } catch (error) {
      setStatus(describeError(error, 'Unable to load medical records'))
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void reload()
  }, [reload])

  const verify = useCallback(
    async (recordId: string) => {
      setBusyId(recordId)
      try {
        await verifyMedicalRecord(request, recordId)
        setStatus('Record verified.')
        await reload()
      } catch (error) {
        setStatus(describeError(error, 'Unable to verify record'))
      } finally {
        setBusyId(null)
      }
    },
    [reload, request],
  )

  const remove = useCallback(
    async (recordId: string) => {
      setBusyId(recordId)
      try {
        await deleteMedicalRecord(request, recordId)
        setStatus('Record deleted.')
        await reload()
      } catch (error) {
        setStatus(describeError(error, 'Unable to delete record'))
      } finally {
        setBusyId(null)
      }
    },
    [reload, request],
  )

  return { groups, isLoading, status, busyId, reload, verify, remove }
}
