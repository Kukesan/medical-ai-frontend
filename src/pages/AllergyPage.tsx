import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Shield } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { createAllergy, deleteAllergy, listAllergies } from '../service/allergyService'
import type { AllergyItem } from '../types/api'
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

const emptyForm = { substance: '', severity: '', reaction: '' }

export function AllergyPage() {
  const { request } = useAuth()

  const [allergies, setAllergies] = useState<AllergyItem[]>([])
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
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
        setPendingDeleteId(null)
      }
    },
    [loadAllergies, request],
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Allergies"
        description="Manage your allergy information here."
        actions={
          <Button variant="secondary" onClick={() => void loadAllergies()} isLoading={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh List'}
          </Button>
        }
      />

      <Card>
        <form className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end" onSubmit={onCreate}>
          <Field label="Substance" htmlFor="allergy-substance" required>
            <Input
              id="allergy-substance"
              type="text"
              value={form.substance}
              onChange={(event) => setForm((prev) => ({ ...prev, substance: event.target.value }))}
              required
            />
          </Field>
          <Field label="Severity" htmlFor="allergy-severity" required>
            <Input
              id="allergy-severity"
              type="text"
              value={form.severity}
              onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
              required
            />
          </Field>
          <Field label="Reaction" htmlFor="allergy-reaction" required>
            <Input
              id="allergy-reaction"
              type="text"
              value={form.reaction}
              onChange={(event) => setForm((prev) => ({ ...prev, reaction: event.target.value }))}
              required
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" isLoading={isCreating}>
              {isCreating ? 'Adding...' : 'Add Allergy'}
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
        ) : allergies.length === 0 ? (
          <EmptyState icon={Shield} title="No allergies found." description="Add an allergy using the form above." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Substance</Th>
                <Th>Severity</Th>
                <Th>Reaction</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {allergies.map((allergy) => (
                <Tr key={allergy.id}>
                  <Td className="font-medium text-gray-900">{allergy.substance}</Td>
                  <Td>{allergy.severity}</Td>
                  <Td>{allergy.reaction}</Td>
                  <Td className="text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingDeleteId(allergy.id)}
                      disabled={deletingId === allergy.id}
                    >
                      {deletingId === allergy.id ? 'Deleting...' : 'Delete'}
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
        title="Delete this allergy?"
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
