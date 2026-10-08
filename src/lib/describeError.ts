import { ApiRequestError } from './ApiRequestError'

// Messages produced here are errors even when their wording doesn't say so (e.g. "Password is incorrect"),
// so status alerts can still show them in the danger style. Distinct messages only, so this stays small.
const errorMessages = new Set<string>()

export function isKnownErrorMessage(message: string) {
  return errorMessages.has(message)
}

function friendlyMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 429) {
      return 'Too many requests. Please wait a minute and try again.'
    }
    if (error.status >= 500) {
      return 'Something went wrong on our side. Please try again in a moment.'
    }
    // 4xx messages come from the API and are written for users (validation, not found, wrong password...).
    return error.message || fallback
  }
  // fetch() rejects with a TypeError when the network is down or the server is unreachable.
  if (error instanceof TypeError) {
    return "Can't reach the server. Check your internet connection and try again."
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

/** Turns any thrown value into a message that is safe and useful to show to the user. */
export function describeError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const message = friendlyMessage(error, fallback)
  errorMessages.add(message)
  return message
}
