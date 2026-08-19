import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { ApiRequestError } from '../lib/ApiRequestError'
import { parseFieldErrors } from '../lib/parseFieldErrors'
import { getMedicalRecord, resolveMedicalRecordConflict, verifyMedicalRecord } from '../service/medicalRecordService'
import type { ConflictResolution } from '../service/medicalRecordService'
import {
  abandonRecordIntake,
  answerRecordIntake,
  confirmRecordIntake,
  getRecordIntake,
  startRecordIntake,
} from '../service/recordIntakeService'
import type { MedicalRecord, MedicalRecordListItem, RecordIntakeResponse } from '../types/api'

const INTAKE_SESSION_STORAGE_KEY = 'medical_ai_intake_session_v1'

export type IntakeTranscriptEntry = {
  question: string
  answer: string
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

function persistIntakeId(intakeId: string | null) {
  if (intakeId) {
    sessionStorage.setItem(INTAKE_SESSION_STORAGE_KEY, intakeId)
  } else {
    sessionStorage.removeItem(INTAKE_SESSION_STORAGE_KEY)
  }
}

export function useRecordIntake() {
  const { request } = useAuth()

  const [session, setSession] = useState<RecordIntakeResponse | null>(null)
  const [transcript, setTranscript] = useState<IntakeTranscriptEntry[]>([])
  const [result, setResult] = useState<MedicalRecordListItem | null>(null)
  const [conflictRecord, setConflictRecord] = useState<MedicalRecord | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResuming, setIsResuming] = useState(true)

  const loadConflict = useCallback(
    async (record: MedicalRecordListItem) => {
      if (record.status !== 'conflict_requires_review' || !record.conflict_with_record_id) {
        setConflictRecord(null)
        return
      }
      try {
        const existing = await getMedicalRecord(request, record.conflict_with_record_id)
        setConflictRecord(existing)
      } catch (error) {
        setStatus(describeError(error, 'Unable to load the conflicting record'))
      }
    },
    [request],
  )

  useEffect(() => {
    const storedId = sessionStorage.getItem(INTAKE_SESSION_STORAGE_KEY)
    if (!storedId) {
      setIsResuming(false)
      return
    }

    let cancelled = false
    getRecordIntake(request, storedId)
      .then((data) => {
        if (cancelled) return
        if (data.status === 'completed' || data.status === 'abandoned') {
          persistIntakeId(null)
          return
        }
        setSession(data)
      })
      .catch(() => {
        if (!cancelled) persistIntakeId(null)
      })
      .finally(() => {
        if (!cancelled) setIsResuming(false)
      })

    return () => {
      cancelled = true
    }
  }, [request])

  const reset = useCallback(() => {
    persistIntakeId(null)
    setSession(null)
    setTranscript([])
    setResult(null)
    setConflictRecord(null)
    setFieldErrors({})
    setStatus('')
  }, [])

  const start = useCallback(
    async (text: string) => {
      setIsLoading(true)
      setStatus('')
      setFieldErrors({})
      try {
        const data = await startRecordIntake(request, text)
        setSession(data)
        setTranscript([])
        setResult(null)
        setConflictRecord(null)
        persistIntakeId(data.id)
        return true
      } catch (error) {
        setStatus(describeError(error, 'Unable to start record intake'))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [request],
  )

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!session) return false
      const question = session.pending_question ?? ''
      setIsLoading(true)
      setStatus('')
      try {
        const data = await answerRecordIntake(request, session.id, answer)
        setTranscript((prev) => [...prev, { question, answer }])
        setSession(data)
        return true
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 409) {
          try {
            const data = await getRecordIntake(request, session.id)
            setSession(data)
            setStatus('This session had already moved on — showing its current state.')
          } catch (refetchError) {
            setStatus(describeError(refetchError, 'Unable to refresh session'))
          }
          return false
        }
        setStatus(describeError(error, 'Unable to submit your answer'))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [request, session],
  )

  const confirm = useCallback(
    async (overrides: Record<string, unknown>) => {
      if (!session) return false
      setIsLoading(true)
      setStatus('')
      setFieldErrors({})
      try {
        const record = await confirmRecordIntake(request, session.id, overrides)
        setResult(record)
        persistIntakeId(null)
        await loadConflict(record)
        return true
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 422) {
          setFieldErrors(parseFieldErrors(error.message))
          setStatus(error.message)
          return false
        }
        if (error instanceof ApiRequestError && error.status === 409) {
          try {
            const data = await getRecordIntake(request, session.id)
            setSession(data)
            setStatus('This session is no longer at the confirmation stage — showing its current state.')
          } catch (refetchError) {
            setStatus(describeError(refetchError, 'Unable to refresh session'))
          }
          return false
        }
        setStatus(describeError(error, 'Unable to confirm the draft'))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [loadConflict, request, session],
  )

  const abandon = useCallback(async () => {
    if (!session) {
      reset()
      return
    }
    setIsLoading(true)
    setStatus('')
    try {
      await abandonRecordIntake(request, session.id)
    } catch (error) {
      if (!(error instanceof ApiRequestError && error.status === 409)) {
        setStatus(describeError(error, 'Unable to cancel this session'))
        setIsLoading(false)
        return
      }
    }
    setIsLoading(false)
    reset()
  }, [request, reset, session])

  const verify = useCallback(async () => {
    if (!result) return
    setIsLoading(true)
    setStatus('')
    try {
      const updated = await verifyMedicalRecord(request, result.id)
      setResult(updated)
      setStatus('Record verified.')
    } catch (error) {
      setStatus(describeError(error, 'Unable to verify record'))
    } finally {
      setIsLoading(false)
    }
  }, [request, result])

  const resolveConflict = useCallback(
    async (resolution: ConflictResolution) => {
      if (!result) return
      setIsLoading(true)
      setStatus('')
      try {
        const updated = await resolveMedicalRecordConflict(request, result.id, resolution)
        setResult(updated)
        setStatus('Conflict resolved.')
      } catch (error) {
        setStatus(describeError(error, 'Unable to resolve conflict'))
      } finally {
        setIsLoading(false)
      }
    },
    [request, result],
  )

  return {
    session,
    transcript,
    result,
    conflictRecord,
    fieldErrors,
    status,
    isLoading,
    isResuming,
    start,
    submitAnswer,
    confirm,
    abandon,
    verify,
    resolveConflict,
    reset,
  }
}
