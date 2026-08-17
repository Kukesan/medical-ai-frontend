import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { ApiRequestError } from '../lib/ApiRequestError'
import { getGroupedMedicalRecords } from '../service/medicalRecordService'
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

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getGroupedMedicalRecords(request)
      setGroups(result)
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

  return { groups, isLoading, status, reload }
}
