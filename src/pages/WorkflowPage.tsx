import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/useAuth'
import { useAsyncTask } from '../hooks/useAsyncTask'
import { runDocumentAnalysis } from '../service/analysisService'
import { askChatQuestion, getChatHistory } from '../service/chatService'
import { getDocumentById, listDocuments, uploadDocuments } from '../service/documentService'
import type {
  ChatHistoryResponse,
  ChatResponse,
  DocumentItem,
  UploadResult,
} from '../types/api'


export function WorkflowPage() {
  const { request } = useAuth()

  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null)
  const [analysisIdsInput, setAnalysisIdsInput] = useState('')
  const [documentIdInput, setDocumentIdInput] = useState('')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatSessionId, setChatSessionId] = useState('')

  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const [chatResult, setChatResult] = useState<ChatResponse | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatHistoryResponse | null>(null)

  const [warningMessages, setWarningMessages] = useState<string[]>([])
  const [ setAnalysisTriggered] = useState(false)
  const { status, setStatus, isLoading, run } = useAsyncTask('Start with upload or dashboard refresh.')

  const addWarning = (message?: string) => {
    if (!message) {
      return
    }

    setWarningMessages((current) => {
      if (current.includes(message)) {
        return current
      }
      return [...current, message]
    })
  }

  const handleUpload = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      if (!uploadFiles || uploadFiles.length === 0) {
        setStatus('Select one or more files before upload.')
        return
      }

      const result = await uploadDocuments(request, uploadFiles)

      setUploadResult(result)
      setAnalysisIdsInput(result.uploaded.map((item) => item.document_id).join(', '))
      setStatus(`Uploaded ${result.uploaded.length} document(s).`)
      const list = await listDocuments(request)
      setDocuments(list)
    })
  }

  const fetchDocuments = () => {
    run(async () => {
      const list = await listDocuments(request)
      setDocuments(list)
      setStatus(`Loaded ${list.length} document(s).`)
    })
  }

  const fetchDocumentById = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      if (!documentIdInput.trim()) {
        setStatus('Provide a document ID.')
        return
      }
      const item = await getDocumentById(request, documentIdInput.trim())
      setSelectedDocument(item)
      setStatus(`Loaded ${item.file_name}.`)
    })
  }

  const runAnalysis = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      const ids = analysisIdsInput
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

      if (ids.length === 0) {
        setStatus('Provide at least one document ID.')
        return
      }

      const response = await runDocumentAnalysis(request, ids)

      setStatus(`${response.status}: ${response.message}. Refresh dashboard shortly.`)
    })
  }



  const askChat = (event: FormEvent) => {
    event.preventDefault()
    run(async () => {
      if (!chatQuestion.trim()) {
        setStatus('Enter a question for chat.')
        return
      }

      const response = await askChatQuestion(request, {
          question: chatQuestion.trim(),
          session_id: chatSessionId.trim() || undefined,
      })

      setChatResult(response)
      setChatSessionId(response.session_id)
      addWarning(response.warning?.message)
      setStatus('Chat response received.')
    })
  }

  const loadHistory = () => {
    run(async () => {
      if (!chatSessionId.trim()) {
        setStatus('Provide session ID to load history.')
        return
      }

      const response = await getChatHistory(request, chatSessionId.trim())
      setChatHistory(response)
      setStatus(`Loaded ${response.messages.length} chat message(s).`)
    })
  }

  const cardClass =
    'rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md'
  const headingClass = "font-['Archivo_Black'] text-lg text-gray-900"
  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition placeholder:text-gray-400 focus:border-[#AA1C41] focus:outline-none focus:ring-4 focus:ring-[#AA1C41]/10'
  const primaryButtonClass =
    'rounded-lg bg-gradient-to-r from-[#AA1C41] to-[#D62551] px-4 py-2.5 font-semibold text-white shadow-md shadow-[#AA1C41]/25 transition-all hover:shadow-lg hover:shadow-[#AA1C41]/30 disabled:cursor-not-allowed disabled:opacity-60'
  const secondaryButtonClass =
    'rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-all hover:border-[#AA1C41] hover:bg-[#FFF1F4] hover:text-[#AA1C41] disabled:cursor-not-allowed disabled:opacity-60'
  const listClass = 'mt-3 max-h-52 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3'

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-2">
      <article className={cardClass}>
        <h2 className={headingClass}>Documents</h2>
        <form onSubmit={handleUpload} className="mt-3 grid gap-3">
          <input
            className="block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-[#AA1C41] file:to-[#D62551] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:shadow-md"
            type="file"
            multiple
            onChange={(event) => setUploadFiles(event.target.files)}
          />
          <button className={primaryButtonClass} type="submit" disabled={isLoading}>
            Upload files
          </button>
        </form>
        <div className="mb-3 flex flex-wrap gap-2">
          <button className={secondaryButtonClass} type="button" onClick={fetchDocuments} disabled={isLoading}>
            Refresh documents
          </button>
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={() => setAnalysisIdsInput(documents.map((doc) => doc.id).join(', '))}
            disabled={documents.length === 0 || isLoading}
          >
            Use listed IDs
          </button>
        </div>

        <form onSubmit={fetchDocumentById} className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className={inputClass}
              value={documentIdInput}
              onChange={(event) => setDocumentIdInput(event.target.value)}
              placeholder="Document UUID"
            />
            <button className={primaryButtonClass} type="submit" disabled={isLoading}>
              Get one document
            </button>
          </div>
        </form>

        {uploadResult ? (
          <p className="mt-3 text-sm text-gray-600">
            Uploaded: {uploadResult.uploaded.length}, failed: {uploadResult.failed.length}
          </p>
        ) : null}

        {selectedDocument ? (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {selectedDocument.file_name} ({selectedDocument.processing_status})
          </p>
        ) : null}

        <div className={listClass}>
          {documents.map((doc) => (
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 py-2.5 last:border-b-0" key={doc.id}>
              <strong className="text-gray-900">{doc.file_name}</strong>
              <span className="text-sm text-gray-600">{doc.processing_status}</span>
            </div>
          ))}
        </div>
      </article>

      <article className={cardClass}>
        <h2 className={headingClass}>Analysis</h2>
        <form onSubmit={runAnalysis} className="mt-3 grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-gray-700">
            Document IDs (comma-separated)
            <input
              className={inputClass}
              value={analysisIdsInput}
              onChange={(event) => setAnalysisIdsInput(event.target.value)}
              placeholder="uuid-1, uuid-2"
            />
          </label>
          <button className={primaryButtonClass} type="submit" disabled={isLoading}>
            Trigger analysis
          </button>
        </form>
        <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">⏱️ Analysis endpoint is async. Trigger then refresh dashboard after a short delay.</p>
      </article>

      <article className={`${cardClass} lg:col-span-2`}>
        <h2 className={headingClass}>Chat</h2>
        <form onSubmit={askChat} className="mt-3 grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-gray-700">
            Question
            <input
              className={inputClass}
              value={chatQuestion}
              onChange={(event) => setChatQuestion(event.target.value)}
              placeholder="Can you summarize my recent lab changes?"
            />
          </label>
          <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto]">
            <input
              className={inputClass}
              value={chatSessionId}
              onChange={(event) => setChatSessionId(event.target.value)}
              placeholder="Session UUID (optional)"
            />
            <button className={primaryButtonClass} type="submit" disabled={isLoading}>
              Ask chat
            </button>
            <button className={secondaryButtonClass} type="button" onClick={loadHistory} disabled={isLoading}>
              Load chat history
            </button>
          </div>
        </form>

        {chatResult ? (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900">Latest Response</h3>
            <p className="mt-2 text-gray-700">{chatResult.answer}</p>
            <p className="mt-2 text-sm text-gray-600">Confidence: {chatResult.confidence}</p>
          </div>
        ) : null}

        {chatHistory ? (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900">Session History</h3>
            {chatHistory.messages.map((message, index) => (
              <p className="mt-2 text-gray-700" key={`${message.created_at}-${index}`}>
                <strong>{message.role}:</strong> {message.content}
              </p>
            ))}
          </div>
        ) : null}
      </article>

      <article className={`${cardClass} lg:col-span-2`}>
        <h2 className={headingClass}>Status</h2>
        <p className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          {isLoading ? '⏳ Working...' : status}
        </p>
      </article>

      {warningMessages.length > 0 ? (
        <article
          className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900 shadow-sm lg:col-span-2"
          aria-live="polite"
        >
          <h2 className={headingClass}>⚠️ Medical Warning</h2>
          {warningMessages.map((warning) => (
            <p className="mt-2" key={warning}>
              {warning}
            </p>
          ))}
        </article>
      ) : null}
    </section>
  )
}
