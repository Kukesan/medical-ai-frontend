import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { createSurgery, deleteSurgery, listSurgeries } from '../service/surgeryService'
import type { SurgeryItem } from '../types/api'

const emptyForm = { name: '', date: '', notes: '' }

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

export function SurgeryPage() {
  const { request } = useAuth()

  const [surgeries, setSurgeries] = useState<SurgeryItem[]>([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadSurgeries = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await listSurgeries(request)
      setSurgeries(list)
      setStatus('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load surgeries')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadSurgeries()
  }, [loadSurgeries])

  const onCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const name = form.name.trim()
      const date = form.date
      const notes = form.notes.trim()

      if (!name || !date) {
        setStatus('Name and date are required.')
        return
      }

      setIsCreating(true)
      setStatus('')

      try {
        await createSurgery(request, { name, date, notes })
        setForm(emptyForm)
        setStatus('Surgery added successfully.')
        await loadSurgeries()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to create surgery')
        }
      } finally {
        setIsCreating(false)
      }
    },
    [form, loadSurgeries, request],
  )

  const onDelete = useCallback(
    async (surgeryId: string) => {
      if (!window.confirm('Delete this surgery?')) {
        return
      }

      setDeletingId(surgeryId)
      setStatus('')

      try {
        await deleteSurgery(request, surgeryId)
        setStatus('Surgery deleted successfully.')
        await loadSurgeries()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to delete surgery')
        }
      } finally {
        setDeletingId(null)
      }
    },
    [loadSurgeries, request],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Surgery</h1>
            <p className="mt-2 text-sm text-gray-600">Manage your surgery information here.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadSurgeries()}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#AA1C41] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end" onSubmit={onCreate}>
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
            Date *
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Notes
            <input
              type="text"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-lg bg-[#AA1C41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8C1636] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? 'Adding...' : 'Add Surgery'}
            </button>
          </div>
        </form>

        {status ? <p className="mb-4 text-sm text-gray-700">{status}</p> : null}

        {isLoading ? <p className="text-sm text-gray-600">Loading surgeries...</p> : null}

        {!isLoading && surgeries.length === 0 ? (
          <p className="text-sm text-gray-600">No surgeries found.</p>
        ) : null}

        {!isLoading && surgeries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {surgeries.map((surgery) => (
                  <tr key={surgery.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{surgery.name}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(surgery.date)}</td>
                    <td className="px-4 py-3 text-gray-700">{surgery.notes || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void onDelete(surgery.id)}
                        disabled={deletingId === surgery.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deletingId === surgery.id ? 'Deleting...' : 'Delete'}
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
