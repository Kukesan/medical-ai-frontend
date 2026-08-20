import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getMyProfile, updateMyProfile } from '../service/profileService'
import { createVitals, deleteVitals, listVitals } from '../service/vitalsService'
import type { UserProfile, VitalsEntry } from '../types/api'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  LoadingRow,
  PageHeader,
  Table,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr,
  inferStatusTone,
} from '../components/ui'

type ProfileForm = {
  full_name: string
  date_of_birth: string
  bio: string
  notes: string
}

const emptyForm: ProfileForm = {
  full_name: '',
  date_of_birth: '',
  bio: '',
  notes: '',
}

function toForm(profile: UserProfile): ProfileForm {
  return {
    full_name: profile.full_name,
    date_of_birth: profile.date_of_birth ?? '',
    bio: profile.bio ?? '',
    notes: profile.notes ?? '',
  }
}

type VitalsForm = {
  recorded_at: string
  height: string
  weight: string
  blood_group: string
  pressure: string
  blood_sugar: string
}

const emptyVitalsForm: VitalsForm = {
  recorded_at: new Date().toISOString().slice(0, 10),
  height: '',
  weight: '',
  blood_group: '',
  pressure: '',
  blood_sugar: '',
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    return `Error ${error.status}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export function ProfilePage() {
  const { request } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [vitalsHistory, setVitalsHistory] = useState<VitalsEntry[]>([])
  const [vitalsForm, setVitalsForm] = useState<VitalsForm>(emptyVitalsForm)
  const [vitalsStatus, setVitalsStatus] = useState('')
  const [isVitalsLoading, setIsVitalsLoading] = useState(true)
  const [isAddingVitals, setIsAddingVitals] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeletingVitals, setIsDeletingVitals] = useState(false)

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getMyProfile(request)
      setProfile(data)
      setForm(toForm(data))
      setStatus('')
    } catch (error) {
      setStatus(errorMessage(error, 'Unable to load profile'))
    } finally {
      setIsLoading(false)
    }
  }, [request])

  const loadVitals = useCallback(async () => {
    setIsVitalsLoading(true)
    try {
      const data = await listVitals(request)
      setVitalsHistory(data)
    } catch (error) {
      setVitalsStatus(errorMessage(error, 'Unable to load vitals history'))
    } finally {
      setIsVitalsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadProfile()
    void loadVitals()
  }, [loadProfile, loadVitals])

  const onSave = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const fullName = form.full_name.trim()

      if (!fullName) {
        setStatus('Full name is required.')
        return
      }

      setIsSaving(true)
      setStatus('')

      try {
        const updated = await updateMyProfile(request, {
          full_name: fullName,
          date_of_birth: form.date_of_birth || undefined,
          bio: form.bio.trim() || undefined,
          notes: form.notes.trim() || undefined,
        })
        setProfile(updated)
        setForm(toForm(updated))
        setStatus('Profile updated successfully.')
      } catch (error) {
        setStatus(errorMessage(error, 'Unable to update profile'))
      } finally {
        setIsSaving(false)
      }
    },
    [form, request],
  )

  const onAddVitals = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!vitalsForm.recorded_at) {
        setVitalsStatus('Date is required.')
        return
      }

      setIsAddingVitals(true)
      setVitalsStatus('')

      try {
        await createVitals(request, {
          recorded_at: vitalsForm.recorded_at,
          height: toOptionalNumber(vitalsForm.height),
          weight: toOptionalNumber(vitalsForm.weight),
          blood_group: vitalsForm.blood_group.trim() || undefined,
          pressure: vitalsForm.pressure.trim() || undefined,
          blood_sugar: toOptionalNumber(vitalsForm.blood_sugar),
        })
        setVitalsForm(emptyVitalsForm)
        setVitalsStatus('Vitals entry added.')
        await loadVitals()
      } catch (error) {
        setVitalsStatus(errorMessage(error, 'Unable to add vitals entry'))
      } finally {
        setIsAddingVitals(false)
      }
    },
    [loadVitals, request, vitalsForm],
  )

  const onConfirmDeleteVitals = useCallback(async () => {
    if (!pendingDeleteId) return

    setIsDeletingVitals(true)
    try {
      await deleteVitals(request, pendingDeleteId)
      setPendingDeleteId(null)
      setVitalsStatus('Vitals entry deleted.')
      await loadVitals()
    } catch (error) {
      setVitalsStatus(errorMessage(error, 'Unable to delete vitals entry'))
    } finally {
      setIsDeletingVitals(false)
    }
  }, [loadVitals, pendingDeleteId, request])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Profile"
        description="Manage your profile and account settings here."
        actions={
          <Button variant="secondary" onClick={() => void loadProfile()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <LoadingRow label="Loading profile..." />
        ) : (
          <form onSubmit={onSave} className="space-y-8">
            <div>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">Identity</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email" htmlFor="profile-email">
                  <Input id="profile-email" type="email" value={profile?.email ?? ''} disabled />
                </Field>
                <Field label="Full Name" htmlFor="profile-full-name" required>
                  <Input
                    id="profile-full-name"
                    type="text"
                    value={form.full_name}
                    onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                    required
                    maxLength={100}
                  />
                </Field>
                <Field label="Date of Birth" htmlFor="profile-date-of-birth">
                  <Input
                    id="profile-date-of-birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(event) => setForm((prev) => ({ ...prev, date_of_birth: event.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">About</h2>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Bio" htmlFor="profile-bio">
                  <Textarea
                    id="profile-bio"
                    value={form.bio}
                    onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                    maxLength={2000}
                    placeholder="A short introduction about yourself"
                  />
                </Field>
                <Field label="Notes" htmlFor="profile-notes">
                  <Textarea
                    id="profile-notes"
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    maxLength={2000}
                    placeholder="Anything else worth noting"
                  />
                </Field>
              </div>
            </div>

            <Button type="submit" isLoading={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        )}

        {status ? (
          <Alert tone={inferStatusTone(status)} className="mt-4">
            {status}
          </Alert>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">Vitals History</h2>

        <form onSubmit={onAddVitals} className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Date" htmlFor="vitals-recorded-at" required>
            <Input
              id="vitals-recorded-at"
              type="date"
              value={vitalsForm.recorded_at}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, recorded_at: event.target.value }))}
              required
            />
          </Field>
          <Field label="Height (cm)" htmlFor="vitals-height">
            <Input
              id="vitals-height"
              type="number"
              min={0.01}
              step="any"
              value={vitalsForm.height}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, height: event.target.value }))}
            />
          </Field>
          <Field label="Weight (kg)" htmlFor="vitals-weight">
            <Input
              id="vitals-weight"
              type="number"
              min={0.01}
              step="any"
              value={vitalsForm.weight}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, weight: event.target.value }))}
            />
          </Field>
          <Field label="Blood Group" htmlFor="vitals-blood-group">
            <Input
              id="vitals-blood-group"
              type="text"
              value={vitalsForm.blood_group}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, blood_group: event.target.value }))}
              maxLength={5}
              placeholder="e.g. O+"
            />
          </Field>
          <Field label="Blood Pressure" htmlFor="vitals-pressure">
            <Input
              id="vitals-pressure"
              type="text"
              value={vitalsForm.pressure}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, pressure: event.target.value }))}
              placeholder="e.g. 120/80"
              maxLength={20}
            />
          </Field>
          <Field label="Blood Sugar" htmlFor="vitals-blood-sugar">
            <Input
              id="vitals-blood-sugar"
              type="number"
              min={0.01}
              step="any"
              value={vitalsForm.blood_sugar}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, blood_sugar: event.target.value }))}
            />
          </Field>
          <div className="sm:col-span-3 lg:col-span-6">
            <Button type="submit" isLoading={isAddingVitals}>
              {isAddingVitals ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </form>

        {vitalsStatus ? (
          <Alert tone={inferStatusTone(vitalsStatus)} className="mt-4">
            {vitalsStatus}
          </Alert>
        ) : null}

        <div className="mt-6">
          {isVitalsLoading ? (
            <LoadingRow label="Loading vitals history..." />
          ) : vitalsHistory.length === 0 ? (
            <EmptyState title="No vitals recorded yet." description="Add an entry above to start tracking." />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Height (cm)</Th>
                  <Th>Weight (kg)</Th>
                  <Th>Blood Group</Th>
                  <Th>Pressure</Th>
                  <Th>Blood Sugar</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {vitalsHistory.map((entry) => (
                  <Tr key={entry.id}>
                    <Td>{entry.recorded_at}</Td>
                    <Td>{entry.height ?? '-'}</Td>
                    <Td>{entry.weight ?? '-'}</Td>
                    <Td>{entry.blood_group ?? '-'}</Td>
                    <Td>{entry.pressure ?? '-'}</Td>
                    <Td>{entry.blood_sugar ?? '-'}</Td>
                    <Td>
                      <Button variant="danger" size="sm" onClick={() => setPendingDeleteId(entry.id)}>
                        Delete
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete vitals entry?"
        description="This vitals entry will be permanently removed."
        isLoading={isDeletingVitals}
        onConfirm={() => void onConfirmDeleteVitals()}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
