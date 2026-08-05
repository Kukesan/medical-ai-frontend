import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { createVaccination, deleteVaccination, listVaccinations } from '../service/vaccinationService'
import type { VaccinationItem } from '../types/api'

const emptyForm = { name: '', date_administered: '', is_next_due: false, next_due_date: '' }

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

export function VaccinationPage() {
  const { request } = useAuth()

  const [vaccinations, setVaccinations] = useState<VaccinationItem[]>([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadVaccinations = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await listVaccinations(request)
      setVaccinations(list)
      setStatus('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load vaccinations')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadVaccinations()
  }, [loadVaccinations])

  const onCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const name = form.name.trim()
      const dateAdministered = form.date_administered

      if (!name || !dateAdministered) {
        setStatus('Name and date administered are required.')
        return
      }

      if (form.is_next_due && !form.next_due_date) {
        setStatus('Next due date is required when next dose is due.')
        return
      }

      setIsCreating(true)
      setStatus('')

      try {
        await createVaccination(request, {
          name,
          date_administered: dateAdministered,
          is_next_due: form.is_next_due,
          next_due_date: form.next_due_date || null,
        })
        setForm(emptyForm)
        setStatus('Vaccination added successfully.')
        await loadVaccinations()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to create vaccination')
        }
      } finally {
        setIsCreating(false)
      }
    },
    [form, loadVaccinations, request],
  )

  const onDelete = useCallback(
    async (vaccinationId: string) => {
      if (!window.confirm('Delete this vaccination?')) {
        return
      }

      setDeletingId(vaccinationId)
      setStatus('')

      try {
        await deleteVaccination(request, vaccinationId)
        setStatus('Vaccination deleted successfully.')
        await loadVaccinations()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to delete vaccination')
        }
      } finally {
        setDeletingId(null)
      }
    },
    [loadVaccinations, request],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vaccination</h1>
            <p className="mt-2 text-sm text-gray-600">Manage your vaccination information here.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadVaccinations()}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#AA1C41] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:items-end" onSubmit={onCreate}>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Name *
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Date Administered *
            <input
              type="date"
              value={form.date_administered}
              onChange={(event) => setForm((prev) => ({ ...prev, date_administered: event.target.value }))}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_next_due}
              onChange={(event) => setForm((prev) => ({ ...prev, is_next_due: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[#AA1C41] focus:ring-[#AA1C41]"
            />
            Next Dose Due
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Next Due Date{form.is_next_due ? ' *' : ''}
            <input
              type="date"
              value={form.next_due_date}
              onChange={(event) => setForm((prev) => ({ ...prev, next_due_date: event.target.value }))}
              required={form.is_next_due}
              disabled={!form.is_next_due}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-lg bg-[#AA1C41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8C1636] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? 'Adding...' : 'Add Vaccination'}
            </button>
          </div>
        </form>

        {status ? <p className="mb-4 text-sm text-gray-700">{status}</p> : null}

        {isLoading ? <p className="text-sm text-gray-600">Loading vaccinations...</p> : null}

        {!isLoading && vaccinations.length === 0 ? (
          <p className="text-sm text-gray-600">No vaccinations found.</p>
        ) : null}

        {!isLoading && vaccinations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date Administered</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Next Dose Due</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Next Due Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vaccinations.map((vaccination) => (
                  <tr key={vaccination.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{vaccination.name}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(vaccination.date_administered)}</td>
                    <td className="px-4 py-3 text-gray-700">{vaccination.is_next_due ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(vaccination.next_due_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void onDelete(vaccination.id)}
                        disabled={deletingId === vaccination.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deletingId === vaccination.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}
