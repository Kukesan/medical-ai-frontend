import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Syringe } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { createVaccination, deleteVaccination, listVaccinations } from '../service/vaccinationService'
import type { VaccinationItem } from '../types/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  PageHeader,
  SkeletonLines,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  inferStatusTone,
} from '../components/ui'

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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
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
        setPendingDeleteId(null)
      }
    },
    [loadVaccinations, request],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Vaccinations"
        description="Manage your vaccination information here."
        actions={
          <Button variant="secondary" onClick={() => void loadVaccinations()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh List'}
          </Button>
        }
      />

      <Card>
        <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-4" onSubmit={onCreate}>
          <Field label="Name" htmlFor="vaccination-name" required>
            <Input
              id="vaccination-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </Field>
          <Field label="Date Administered" htmlFor="vaccination-date" required>
            <Input
              id="vaccination-date"
              type="date"
              value={form.date_administered}
              onChange={(event) => setForm((prev) => ({ ...prev, date_administered: event.target.value }))}
              required
            />
          </Field>
          <label htmlFor="vaccination-next-due" className="flex items-center gap-2 pb-2.5 text-sm text-gray-700">
            <Checkbox
              id="vaccination-next-due"
              checked={form.is_next_due}
              onChange={(event) => setForm((prev) => ({ ...prev, is_next_due: event.target.checked }))}
            />
            Next Dose Due
          </label>
          <Field label="Next Due Date" htmlFor="vaccination-next-due-date" required={form.is_next_due}>
            <Input
              id="vaccination-next-due-date"
              type="date"
              value={form.next_due_date}
              onChange={(event) => setForm((prev) => ({ ...prev, next_due_date: event.target.value }))}
              required={form.is_next_due}
              disabled={!form.is_next_due}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" isLoading={isCreating}>
              {isCreating ? 'Adding...' : 'Add Vaccination'}
            </Button>
          </div>
        </form>

        {status ? (
          <Alert tone={inferStatusTone(status)} className="mb-4">
            {status}
          </Alert>
        ) : null}

        {isLoading ? (
          <SkeletonLines count={4} />
        ) : vaccinations.length === 0 ? (
          <EmptyState icon={Syringe} title="No vaccinations found." description="Add a vaccination using the form above." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Date Administered</Th>
                <Th>Next Dose Due</Th>
                <Th>Next Due Date</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {vaccinations.map((vaccination) => (
                <Tr key={vaccination.id}>
                  <Td className="font-medium text-gray-900">{vaccination.name}</Td>
                  <Td>{formatDate(vaccination.date_administered)}</Td>
                  <Td>
                    <Badge tone={vaccination.is_next_due ? 'warning' : 'neutral'}>
                      {vaccination.is_next_due ? 'Yes' : 'No'}
                    </Badge>
                  </Td>
                  <Td>{formatDate(vaccination.next_due_date)}</Td>
                  <Td className="text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingDeleteId(vaccination.id)}
                      disabled={deletingId === vaccination.id}
                    >
                      {deletingId === vaccination.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this vaccination?"
        description="This action cannot be undone."
        isLoading={deletingId !== null}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            void onDelete(pendingDeleteId)
          }
        }}
      />
    </div>
  )
}
