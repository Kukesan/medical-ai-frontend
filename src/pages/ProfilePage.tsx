import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getMyProfile, updateMyProfile } from '../service/profileService'
import type { UserProfile } from '../types/api'
import { Alert, Button, Card, Field, Input, LoadingRow, PageHeader, inferStatusTone } from '../components/ui'

type ProfileForm = {
  full_name: string
  age: string
  height: string
  weight: string
  blood_group: string
  pressure: string
  blood_sugar: string
}

const emptyForm: ProfileForm = {
  full_name: '',
  age: '',
  height: '',
  weight: '',
  blood_group: '',
  pressure: '',
  blood_sugar: '',
}

function toForm(profile: UserProfile): ProfileForm {
  return {
    full_name: profile.full_name,
    age: profile.age != null ? String(profile.age) : '',
    height: profile.height != null ? String(profile.height) : '',
    weight: profile.weight != null ? String(profile.weight) : '',
    blood_group: profile.blood_group ?? '',
    pressure: profile.pressure ?? '',
    blood_sugar: profile.blood_sugar != null ? String(profile.blood_sugar) : '',
  }
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}

export function ProfilePage() {
  const { request } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getMyProfile(request)
      setProfile(data)
      setForm(toForm(data))
      setStatus('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load profile')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const onSave = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const fullName = form.full_name.trim()
      const bloodGroup = form.blood_group.trim()
      const pressure = form.pressure.trim()

      if (!fullName) {
        setStatus('Full name is required.')
        return
      }

      setIsSaving(true)
      setStatus('')

      try {
        const updated = await updateMyProfile(request, {
          full_name: fullName,
          age: toOptionalNumber(form.age),
          height: toOptionalNumber(form.height),
          weight: toOptionalNumber(form.weight),
          blood_group: bloodGroup || undefined,
          pressure: pressure || undefined,
          blood_sugar: toOptionalNumber(form.blood_sugar),
        })
        setProfile(updated)
        setForm(toForm(updated))
        setStatus('Profile updated successfully.')
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to update profile')
        }
      } finally {
        setIsSaving(false)
      }
    },
    [form, request],
  )

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
                <Field label="Age" htmlFor="profile-age">
                  <Input
                    id="profile-age"
                    type="number"
                    min={1}
                    max={149}
                    value={form.age}
                    onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">Vitals</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Height (cm)" htmlFor="profile-height">
                  <Input
                    id="profile-height"
                    type="number"
                    min={0.01}
                    step="any"
                    value={form.height}
                    onChange={(event) => setForm((prev) => ({ ...prev, height: event.target.value }))}
                  />
                </Field>
                <Field label="Weight (kg)" htmlFor="profile-weight">
                  <Input
                    id="profile-weight"
                    type="number"
                    min={0.01}
                    step="any"
                    value={form.weight}
                    onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
                  />
                </Field>
                <Field label="Blood Group" htmlFor="profile-blood-group">
                  <Input
                    id="profile-blood-group"
                    type="text"
                    value={form.blood_group}
                    onChange={(event) => setForm((prev) => ({ ...prev, blood_group: event.target.value }))}
                    maxLength={5}
                    placeholder="e.g. O+"
                  />
                </Field>
                <Field label="Blood Pressure" htmlFor="profile-pressure">
                  <Input
                    id="profile-pressure"
                    type="text"
                    value={form.pressure}
                    onChange={(event) => setForm((prev) => ({ ...prev, pressure: event.target.value }))}
                    placeholder="e.g. 120/80"
                    maxLength={20}
                  />
                </Field>
                <Field label="Blood Sugar" htmlFor="profile-blood-sugar">
                  <Input
                    id="profile-blood-sugar"
                    type="number"
                    min={0.01}
                    step="any"
                    value={form.blood_sugar}
                    onChange={(event) => setForm((prev) => ({ ...prev, blood_sugar: event.target.value }))}
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
    </div>
  )
}
