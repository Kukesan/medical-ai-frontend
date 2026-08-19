import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, MessageCircleQuestion, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRecordIntake } from '../hooks/useRecordIntake'
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  RecordStatusBadge,
  Spinner,
  Textarea,
  buttonClassName,
  inferStatusTone,
} from '../components/ui'

function formatLabel(key: string) {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

function DataSummary({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data)

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">No additional details.</p>
  }

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{formatLabel(key)}</dt>
          <dd className="text-sm text-gray-800">{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function RecordIntakePage() {
  const {
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
  } = useRecordIntake()

  const [composeText, setComposeText] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (session && session.status === 'awaiting_confirmation') {
      const fields = Array.from(new Set([...Object.keys(session.data), ...session.missing_fields]))
      const initial: Record<string, string> = {}
      fields.forEach((key) => {
        const value = session.data[key]
        initial[key] = value === null || value === undefined ? '' : String(value)
      })
      setEditValues(initial)
    }
  }, [session])

  useEffect(() => {
    setAnswerText('')
  }, [session?.pending_question])

  const onCompose = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = composeText.trim()
    if (!trimmed || isLoading) return
    const ok = await start(trimmed)
    if (ok) setComposeText('')
  }

  const onSubmitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = answerText.trim()
    if (!trimmed || isLoading) return
    await submitAnswer(trimmed)
  }

  const onSubmitDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) return

    const overrides: Record<string, unknown> = {}
    Object.entries(editValues).forEach(([key, value]) => {
      const original = session.data[key]
      const originalStr = original === null || original === undefined ? '' : String(original)
      if (value !== originalStr) {
        overrides[key] = value.trim() === '' ? null : value
      }
    })

    await confirm(overrides)
  }

  const canVerify = result && (result.status === 'needs_review' || result.status === 'user_edited')
  const isConflict = result?.status === 'conflict_requires_review'
  const isVerified = result?.status === 'verified'

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Add Record"
        description="Describe a medical event in your own words and we'll turn it into a structured record."
      />

      {status ? <Alert tone={inferStatusTone(status)}>{status}</Alert> : null}

      {isResuming ? (
        <Card className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner />
          Resuming your in-progress record...
        </Card>
      ) : result ? (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">{formatLabel(result.record_type)}</span>
              <RecordStatusBadge status={result.status} />
            </div>
          </div>

          <DataSummary data={result.data} />

          {isConflict ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                This conflicts with a previously verified record. Choose which version to keep.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Existing (verified)</p>
                  <div className="mt-1">
                    {conflictRecord ? <DataSummary data={conflictRecord.data} /> : <p className="text-sm text-gray-400">Loading...</p>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Incoming (new)</p>
                  <div className="mt-1">
                    <DataSummary data={result.data} />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" isLoading={isLoading} onClick={() => void resolveConflict('keep_existing')}>
                  Keep Existing
                </Button>
                <Button size="sm" isLoading={isLoading} onClick={() => void resolveConflict('accept_incoming')}>
                  Accept Incoming
                </Button>
              </div>
            </div>
          ) : isVerified ? (
            <Alert tone="success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Record verified.
              </div>
            </Alert>
          ) : canVerify ? (
            <div className="flex flex-wrap gap-3">
              <Button isLoading={isLoading} onClick={() => void verify()}>
                Verify
              </Button>
              <Link to="/medical-records" className={buttonClassName('secondary')}>
                Review in Medical Records
              </Link>
            </div>
          ) : null}

          <div className="border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={reset}>
              Add Another Record
            </Button>
          </div>
        </Card>
      ) : !session ? (
        <Card>
          <form onSubmit={onCompose} className="flex flex-col gap-4">
            <Field label="What happened?" htmlFor="intake-text" hint="Describe it in your own words, e.g. 'I twisted my ankle playing football yesterday.'">
              <Textarea
                id="intake-text"
                value={composeText}
                onChange={(event) => setComposeText(event.target.value)}
                placeholder="I twisted my ankle playing football yesterday"
                disabled={isLoading}
                required
              />
            </Field>
            <div>
              <Button type="submit" isLoading={isLoading} disabled={!composeText.trim()}>
                <Sparkles className="h-4 w-4" />
                Start
              </Button>
            </div>
          </form>
        </Card>
      ) : session.status === 'awaiting_clarification' ? (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-semibold text-gray-900">
              {session.record_type_name ?? 'Classifying your record'}
            </span>
            {session.is_new_record_type ? <Badge tone="primary">New type</Badge> : null}
          </div>

          {transcript.length > 0 ? (
            <div className="flex flex-col gap-3">
              {transcript.map((entry, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="font-medium text-gray-700">{entry.question}</p>
                  <p className="mt-1 text-gray-600">{entry.answer}</p>
                </div>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmitAnswer} className="flex flex-col gap-3">
            <Field label={session.pending_question ?? 'Please provide more detail'} htmlFor="intake-answer">
              <Input
                id="intake-answer"
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                disabled={isLoading}
                autoFocus
                required
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={isLoading} disabled={!answerText.trim()}>
                Continue
              </Button>
              <Button type="button" variant="secondary" disabled={isLoading} onClick={() => void abandon()}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          <form onSubmit={onSubmitDraft} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                {session.record_type_name ?? 'Review your record'}
              </span>
              {session.is_new_record_type ? <Badge tone="primary">New type</Badge> : null}
            </div>
            <p className="text-sm text-gray-500">Review the details below and edit anything that isn't right.</p>

            <div className="grid gap-4 sm:grid-cols-2">
              {Object.keys(editValues).map((key) => (
                <Field key={key} label={formatLabel(key)} htmlFor={`field-${key}`} required={session.missing_fields.includes(key)}>
                  <Input
                    id={`field-${key}`}
                    value={editValues[key]}
                    onChange={(event) => setEditValues((prev) => ({ ...prev, [key]: event.target.value }))}
                    disabled={isLoading}
                  />
                  {fieldErrors[key] ? <p className="text-xs text-red-600">{fieldErrors[key]}</p> : null}
                </Field>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
              <Button type="submit" isLoading={isLoading}>
                Confirm & Save
              </Button>
              <Button type="button" variant="secondary" disabled={isLoading} onClick={() => void abandon()}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
