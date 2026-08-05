import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { createAllergy, deleteAllergy, listAllergies } from '../service/allergyService'
import type { AllergyItem } from '../types/api'

const emptyForm = { substance: '', severity: '', reaction: '' }

export function AllergyPage() {
  const { request } = useAuth()

  const [allergies, setAllergies] = useState<AllergyItem[]>([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadAllergies = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await listAllergies(request)
      setAllergies(list)
      setStatus('')
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load allergies')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadAllergies()
  }, [loadAllergies])

  const onCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const substance = form.substance.trim()
      const severity = form.severity.trim()
      const reaction = form.reaction.trim()

      if (!substance || !severity || !reaction) {
        setStatus('Substance, severity, and reaction are all required.')
        return
      }

      setIsCreating(true)
      setStatus('')

      try {
        await createAllergy(request, { substance, severity, reaction })
        setForm(emptyForm)
        setStatus('Allergy added successfully.')
        await loadAllergies()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to create allergy')
        }
      } finally {
        setIsCreating(false)
      }
    },
    [form, loadAllergies, request],
  )

  const onDelete = useCallback(
    async (allergyId: string) => {
      if (!window.confirm('Delete this allergy?')) {
        return
      }

      setDeletingId(allergyId)
      setStatus('')

      try {
        await deleteAllergy(request, allergyId)
        setStatus('Allergy deleted successfully.')
        await loadAllergies()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to delete allergy')
        }
      } finally {
        setDeletingId(null)
      }
    },
    [loadAllergies, request],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Allergy</h1>
            <p className="mt-2 text-sm text-gray-600">Manage your allergy information here.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadAllergies()}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#AA1C41] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end" onSubmit={onCreate}>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Substance *
            <input
              type="text"
              value={form.substance}
              onChange={(event) => setForm((prev) => ({ ...prev, substance: event.target.value }))}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Severity *
            <input
              type="text"
              value={form.severity}
              onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Reaction *
            <input
              type="text"
              value={form.reaction}
              onChange={(event) => setForm((prev) => ({ ...prev, reaction: event.target.value }))}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#AA1C41] focus:outline-none"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-lg bg-[#AA1C41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8C1636] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? 'Adding...' : 'Add Allergy'}
            </button>
          </div>
        </form>

        {status ? <p className="mb-4 text-sm text-gray-700">{status}</p> : null}

        {isLoading ? <p className="text-sm text-gray-600">Loading allergies...</p> : null}

        {!isLoading && allergies.length === 0 ? (
          <p className="text-sm text-gray-600">No allergies found.</p>
        ) : null}

        {!isLoading && allergies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Substance</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Severity</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Reaction</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allergies.map((allergy) => (
                  <tr key={allergy.id} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{allergy.substance}</td>
                    <td className="px-4 py-3 text-gray-700">{allergy.severity}</td>
                    <td className="px-4 py-3 text-gray-700">{allergy.reaction}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void onDelete(allergy.id)}
                        disabled={deletingId === allergy.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deletingId === allergy.id ? 'Deleting...' : 'Delete'}
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
