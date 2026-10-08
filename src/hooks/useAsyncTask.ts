import { useCallback, useState } from 'react'
import { describeError } from '../lib/describeError'

export function useAsyncTask(initialStatus: string) {
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)

  const run = useCallback(async (task: () => Promise<void>) => {
    setIsLoading(true)
    try {
      await task()
    } catch (error) {
      setStatus(describeError(error, 'Unknown error'))
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