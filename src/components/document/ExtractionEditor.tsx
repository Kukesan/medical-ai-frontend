import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Checkbox, Input, Textarea } from '../ui'
import { emptyLike, humanizeKey, isPlainObject } from './jsonValue'
import type { JsonValue } from './jsonValue'

type NodeProps = {
  value: JsonValue
  editable: boolean
  onChange: (value: JsonValue) => void
}

function PrimitiveField({ value, editable, onChange }: NodeProps) {
  if (!editable) {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">—</span>
    }
    if (typeof value === 'boolean') {
      return <span className="text-gray-900">{value ? 'Yes' : 'No'}</span>
    }
    return <span className="whitespace-pre-wrap break-words text-gray-900">{String(value)}</span>
  }

  if (typeof value === 'boolean') {
    return <Checkbox checked={value} onChange={(event) => onChange(event.target.checked)} />
  }

  if (typeof value === 'number') {
    return (
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
      />
    )
  }

  const text = value === null ? '' : String(value)
  if (text.length > 60 || text.includes('\n')) {
    return (
      <Textarea
        value={text}
        onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
      />
    )
  }

  return (
    <Input
      value={text}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
    />
  )
}

function ArrayField({
  value,
  editable,
  onChange,
}: {
  value: JsonValue[]
  editable: boolean
  onChange: (value: JsonValue[]) => void
}) {
  const updateItem = (index: number, item: JsonValue) => {
    const next = value.slice()
    next[index] = item
    onChange(next)
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const addItem = () => {
    const template = value.length > 0 ? emptyLike(value[0]) : ''
    onChange([...value, template])
  }

  if (value.length === 0 && !editable) {
    return <span className="text-gray-400">—</span>
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5">
          <div className="min-w-0 flex-1">
            <JsonNode value={item} editable={editable} onChange={(next) => updateItem(index, next)} />
          </div>
          {editable ? (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-1 shrink-0 text-gray-400 transition hover:text-red-600"
              aria-label={`Remove item ${index + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ))}

      {editable ? (
        <Button type="button" variant="ghost" size="sm" onClick={addItem} className="w-fit">
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
      ) : null}
    </div>
  )
}

function ObjectField({
  value,
  editable,
  onChange,
}: {
  value: { [key: string]: JsonValue }
  editable: boolean
  onChange: (value: { [key: string]: JsonValue }) => void
}) {
  const [newKey, setNewKey] = useState('')
  const keys = Object.keys(value)

  const updateField = (key: string, fieldValue: JsonValue) => {
    onChange({ ...value, [key]: fieldValue })
  }

  const removeField = (key: string) => {
    const next = { ...value }
    delete next[key]
    onChange(next)
  }

  const addField = () => {
    const key = newKey.trim()
    if (!key || key in value) {
      return
    }
    onChange({ ...value, [key]: '' })
    setNewKey('')
  }

  if (keys.length === 0 && !editable) {
    return <span className="text-gray-400">—</span>
  }

  return (
    <div className="flex flex-col gap-3">
      {keys.map((key) => (
        <div key={key} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-3">
          <div className="flex items-center gap-1.5 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>{humanizeKey(key)}</span>
            {editable ? (
              <button
                type="button"
                onClick={() => removeField(key)}
                className="text-gray-300 transition hover:text-red-600"
                aria-label={`Remove ${humanizeKey(key)}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          <div className="min-w-0">
            <JsonNode value={value[key]} editable={editable} onChange={(next) => updateField(key, next)} />
          </div>
        </div>
      ))}

      {editable ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <Input
            value={newKey}
            onChange={(event) => setNewKey(event.target.value)}
            placeholder="New field name"
            className="max-w-[12rem]"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addField()
              }
            }}
          />
          <Button type="button" variant="ghost" size="sm" onClick={addField} disabled={!newKey.trim()}>
            <Plus className="h-3.5 w-3.5" />
            Add field
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function JsonNode({ value, editable, onChange }: NodeProps) {
  if (Array.isArray(value)) {
    return <ArrayField value={value} editable={editable} onChange={onChange as (v: JsonValue[]) => void} />
  }
  if (isPlainObject(value)) {
    return (
      <div className="border-l-2 border-gray-100 pl-4">
        <ObjectField value={value} editable={editable} onChange={onChange as (v: { [key: string]: JsonValue }) => void} />
      </div>
    )
  }
  return <PrimitiveField value={value} editable={editable} onChange={onChange} />
}

export function ExtractionEditor({
  data,
  editable,
  onChange,
}: {
  data: { [key: string]: JsonValue } | null
  editable: boolean
  onChange: (value: { [key: string]: JsonValue }) => void
}) {
  const value = data ?? {}

  if (Object.keys(value).length === 0 && !editable) {
    return <p className="text-sm text-gray-500">No extracted data available.</p>
  }

  return <ObjectField value={value} editable={editable} onChange={onChange} />
}
