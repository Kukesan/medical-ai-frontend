export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function humanizeKey(key: string): string {
  const spaced = key.replace(/_/g, ' ').trim()
  if (!spaced) return key
  return spaced.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function emptyLike(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return []
  }
  if (isPlainObject(value)) {
    const result: { [key: string]: JsonValue } = {}
    Object.keys(value).forEach((key) => {
      result[key] = emptyLike(value[key])
    })
    return result
  }
  if (typeof value === 'number') return 0
  if (typeof value === 'boolean') return false
  return ''
}
