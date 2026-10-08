import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { describeError } from '../lib/describeError'
import { useAuth } from '../context/useAuth'
import { deleteMyAccount, getMyProfile, updateMyProfile } from '../service/profileService'
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

/** Today's date in the user's own time zone (toISOString would give the UTC date, a day off in the early morning). */
function localToday(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const emptyVitalsForm = (): VitalsForm => ({
  recorded_at: localToday(),
  height: '',
  weight: '',
  blood_group: '',
  pressure: '',
  blood_sugar: '',
})

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}


export function ProfilePage() {
  const { request, logout, changePassword } = useAuth()
  const navigate = useNavigate()

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

  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordStatus, setPasswordStatus] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteAccountStatus, setDeleteAccountStatus] = useState('')
  const [isConfirmingAccountDelete, setIsConfirmingAccountDelete] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getMyProfile(request)
      setProfile(data)
      setForm(toForm(data))
      setStatus('')
    } catch (error) {
      setStatus(describeError(error, 'Unable to load profile'))
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
      setVitalsStatus(describeError(error, 'Unable to load vitals history'))
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
        setStatus(describeError(error, 'Unable to update profile'))
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
        setVitalsForm(emptyVitalsForm())
        setVitalsStatus('Vitals entry added.')
        await loadVitals()
      } catch (error) {
        setVitalsStatus(describeError(error, 'Unable to add vitals entry'))
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
      setVitalsStatus(describeError(error, 'Unable to delete vitals entry'))
    } finally {
      setIsDeletingVitals(false)
    }
  }, [loadVitals, pendingDeleteId, request])

  const onChangePassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (passwordForm.next !== passwordForm.confirm) {
        setPasswordStatus(describeError(new Error('The new passwords do not match.')))
        return
      }

      setIsChangingPassword(true)
      setPasswordStatus('')
      try {
        await changePassword({ current_password: passwordForm.current, new_password: passwordForm.next })
        setPasswordForm({ current: '', next: '', confirm: '' })
        setPasswordStatus('Password updated successfully. Other devices have been signed out.')
      } catch (error) {
        setPasswordStatus(describeError(error, 'Unable to change your password'))
      } finally {
        setIsChangingPassword(false)
      }
    },
    [changePassword, passwordForm],
  )

  const onConfirmDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true)
    setDeleteAccountStatus('')
    try {
      await deleteMyAccount(request, deletePassword)
      logout()
      navigate('/', { replace: true })
    } catch (error) {
      setIsConfirmingAccountDelete(false)
      setDeleteAccountStatus(describeError(error, 'Unable to delete your account'))
    } finally {
      setIsDeletingAccount(false)
    }
  }, [deletePassword, logout, navigate, request])

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
              <h2 className="mb-4 text-base font-semibold text-gray-900">Identity</h2>
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

            <div className="border-t border-gray-100 pt-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900">About</h2>
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

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <Button type="submit" isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}

        {status ? (
          <Alert tone={inferStatusTone(status)} className="mt-4">
            {status}
          </Alert>
        ) : null}
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Vitals History</h2>

        <form
          onSubmit={onAddVitals}
          className="grid grid-cols-1 gap-4 rounded-lg border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-3 xl:grid-cols-6"
        >
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
          <Field label="Blood Sugar (mg/dL)" htmlFor="vitals-blood-sugar">
            <Input
              id="vitals-blood-sugar"
              type="number"
              min={0.01}
              step="any"
              value={vitalsForm.blood_sugar}
              onChange={(event) => setVitalsForm((prev) => ({ ...prev, blood_sugar: event.target.value }))}
            />
          </Field>
          <div className="sm:col-span-3 xl:col-span-6">
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
                  <Th>Blood Sugar (mg/dL)</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {vitalsHistory.map((entry) => (
                  <Tr key={entry.id}>
                    <Td className="whitespace-nowrap font-medium text-gray-900">{entry.recorded_at}</Td>
                    <Td>{entry.height ?? '-'}</Td>
                    <Td>{entry.weight ?? '-'}</Td>
                    <Td>{entry.blood_group ?? '-'}</Td>
                    <Td>{entry.pressure ?? '-'}</Td>
                    <Td>{entry.blood_sugar ?? '-'}</Td>
                    <Td className="text-right">
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

      <Card>
        <h2 className="text-base font-semibold text-gray-900">Change password</h2>
        <p className="mt-1 text-sm text-gray-500">You'll stay signed in here; other devices will be signed out.</p>
        <form onSubmit={onChangePassword} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Current password" htmlFor="current-password" required>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={passwordForm.current}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, current: event.target.value }))}
              required
            />
          </Field>
          <Field label="New password" htmlFor="new-password" required hint="At least 8 characters">
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={passwordForm.next}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, next: event.target.value }))}
              required
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm-password" required>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={passwordForm.confirm}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
              required
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" isLoading={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
        {passwordStatus ? (
          <Alert tone={inferStatusTone(passwordStatus)} className="mt-4">
            {passwordStatus}
          </Alert>
        ) : null}
      </Card>

      <Card className="border-red-200">
        <h2 className="text-base font-semibold text-gray-900">Delete account</h2>
        <p className="mt-1 text-sm text-gray-500">
          Permanently delete your account, documents, medical records, vitals, analysis results and chats. This cannot
          be undone.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            setDeleteAccountStatus('')
            setIsConfirmingAccountDelete(true)
          }}
        >
          <Field label="Confirm with your password" htmlFor="delete-account-password" required className="sm:w-72">
            <Input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" variant="dangerSolid" disabled={!deletePassword}>
            Delete my account
          </Button>
        </form>
        {deleteAccountStatus ? (
          <Alert tone="danger" className="mt-4">
            {deleteAccountStatus}
          </Alert>
        ) : null}
      </Card>

      <ConfirmDialog
        open={isConfirmingAccountDelete}
        title="Delete your account?"
        description="All of your documents, records and history will be permanently deleted. This cannot be undone."
        confirmLabel="Delete account"
        isLoading={isDeletingAccount}
        onConfirm={() => void onConfirmDeleteAccount()}
        onCancel={() => setIsConfirmingAccountDelete(false)}
      />

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
