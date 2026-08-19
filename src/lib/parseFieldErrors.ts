export function parseFieldErrors(message: string): Record<string, string> {
  const errors: Record<string, string> = {}

  message.split(';').forEach((part) => {
    const trimmed = part.trim()
    if (!trimmed) return

    const requiredMatch = trimmed.match(/'([\w-]+)' is a required property/)
    if (requiredMatch) {
      errors[requiredMatch[1]] = 'This field is required.'
      return
    }

    const colonIndex = trimmed.indexOf(':')
    if (colonIndex > -1) {
      const field = trimmed.slice(0, colonIndex).trim()
      const detail = trimmed.slice(colonIndex + 1).trim()
      if (field && field !== '(root)') {
        errors[field] = detail
      }
    }
  })

  return errors
}
