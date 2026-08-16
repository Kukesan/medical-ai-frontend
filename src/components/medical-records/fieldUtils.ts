export type RecordFieldType = 'text' | 'textarea' | 'date' | 'datetime' | 'boolean'

export type RecordFieldConfig = {
  key: string
  label: string
  type: RecordFieldType
  required?: boolean
}

export function formatFieldValue(value: unknown, type: RecordFieldType): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (type === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if ((type === 'date' || type === 'datetime') && typeof value === 'string') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: type === 'datetime' ? 'short' : undefined,
    }).format(date)
  }

  return String(value)
}

export function toInputValue(value: unknown, type: RecordFieldType): string | boolean {
  if (type === 'boolean') {
    return Boolean(value)
  }

  if (typeof value !== 'string' || !value) {
    return ''
  }

  if (type === 'date') {
    return value.slice(0, 10)
  }

  if (type === 'datetime') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return value
}

export function toPayloadValue(value: string | boolean, type: RecordFieldType): unknown {
  if (type === 'boolean') {
    return value
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  if (type === 'datetime') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  return value
}
