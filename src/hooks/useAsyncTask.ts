import { useCallback, useState } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'

export function useAsyncTask(initialStatus: string) {
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)

  const run = useCallback(async (task: () => Promise<void>) => {
    setIsLoading(true)
    try {
      await task()
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unknown error')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    status,
    setStatus,
    isLoading,
    run,
  }
}