import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getDocumentHtml } from '../service/documentService'
import { Alert, Card, LoadingRow, buttonClassName } from '../components/ui'

export function DocumentDetailsPage() {
  const { requestText } = useAuth()
  const { documentId } = useParams<{ documentId: string }>()

  const [html, setHtml] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('')

  const loadDetails = useCallback(async () => {
    if (!documentId) {
      setStatus('Document id is missing.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setStatus('')

    try {
      const response = await getDocumentHtml(requestText, documentId)
      setHtml(response)
    } catch (error) {
      setHtml('')
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load document details')
      }
    } finally {
      setIsLoading(false)
    }
  }, [documentId, requestText])

  useEffect(() => {
    void loadDetails()
  }, [loadDetails])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Details</h1>
            {documentId ? <p className="mt-1 text-xs text-gray-500">ID: {documentId}</p> : null}
          </div>
          <Link to="/document" className={buttonClassName('secondary', 'md', 'inline-flex items-center gap-2')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>
        </div>

        {isLoading ? <LoadingRow label="Loading document details..." /> : null}
        {status ? (
          <Alert tone="danger" className="mt-5">
            {status}
          </Alert>
        ) : null}

        {!isLoading && !status && html ? (
          <iframe
            title="Document details"
            srcDoc={html}
            sandbox=""
            className="mt-5 h-[80vh] w-full rounded-lg border border-gray-200"
          />
        ) : null}
      </Card>
    </div>
  )
}
