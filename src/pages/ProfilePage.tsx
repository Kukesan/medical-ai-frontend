import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getMyProfile, updateMyProfile } from '../service/profileService'
import type { UserProfile } from '../types/api'

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
    age: String(profile.age),
    height: String(profile.height),
    weight: String(profile.weight),
    blood_group: profile.blood_group,
    pressure: profile.pressure,
    blood_sugar: String(profile.blood_sugar),
  }
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
          age: Number(form.age),
          height: Number(form.height),
          weight: Number(form.weight),
          blood_group: bloodGroup,
          pressure,
          blood_sugar: Number(form.blood_sugar),
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
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-2 text-sm text-gray-600">Manage your profile and account settings here.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadProfile()}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#AA1C41] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {isLoading ? <p className="text-sm text-gray-600">Loading profile...</p> : null}

        {!isLoading ? (
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onSave}>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Email
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Full Name *
              <input
                type="text"
                value={form.full_name}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                required
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Age
              <input
                type="number"
                min={0}
                value={form.age}
                onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Height (cm)
              <input
                type="number"
                min={0}
                value={form.height}
                onChange={(event) => setForm((prev) => ({ ...prev, height: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Weight (kg)
              <input
                type="number"
                min={0}
                value={form.weight}
                onChange={(event) => setForm((prev) => ({ ...prev, weight: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Blood Group
              <input
                type="text"
                value={form.blood_group}
                onChange={(event) => setForm((prev) => ({ ...prev, blood_group: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Blood Pressure
              <input
                type="text"
                value={form.pressure}
                onChange={(event) => setForm((prev) => ({ ...prev, pressure: event.target.value }))}
                placeholder="e.g. 120/80"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Blood Sugar
              <input
                type="number"
                min={0}
                value={form.blood_sugar}
                onChange={(event) => setForm((prev) => ({ ...prev, blood_sugar: event.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-[#AA1C41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8C1636] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : null}

        {status ? <p className="mt-4 text-sm text-gray-700">{status}</p> : null}
      </section>
    </div>
  )
}
