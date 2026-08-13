import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Stethoscope } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { createSurgery, deleteSurgery, listSurgeries } from '../service/surgeryService'
import type { SurgeryItem } from '../types/api'
import {
  Alert,
  Button,
  Card,
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
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
        setPendingDeleteId(null)
      }
    },
    [loadSurgeries, request],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Surgeries"
        description="Manage your surgery information here."
        actions={
          <Button variant="secondary" onClick={() => void loadSurgeries()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh List'}
          </Button>
        }
      />

      <Card>
        <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end" onSubmit={onCreate}>
          <Field label="Name" htmlFor="surgery-name" required>
            <Input
              id="surgery-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </Field>
          <Field label="Date" htmlFor="surgery-date" required>
            <Input
              id="surgery-date"
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
          </Field>
          <Field label="Notes" htmlFor="surgery-notes">
            <Input
              id="surgery-notes"
              type="text"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" isLoading={isCreating}>
              {isCreating ? 'Adding...' : 'Add Surgery'}
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
        ) : surgeries.length === 0 ? (
          <EmptyState icon={Stethoscope} title="No surgeries found." description="Add a surgery using the form above." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Date</Th>
                <Th>Notes</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {surgeries.map((surgery) => (
                <Tr key={surgery.id}>
                  <Td className="font-medium text-gray-900">{surgery.name}</Td>
                  <Td>{formatDate(surgery.date)}</Td>
                  <Td>{surgery.notes || '-'}</Td>
                  <Td className="text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingDeleteId(surgery.id)}
                      disabled={deletingId === surgery.id}
                    >
                      {deletingId === surgery.id ? 'Deleting...' : 'Delete'}
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
        title="Delete this surgery?"
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
