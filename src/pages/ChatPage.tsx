import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { MessageCircle, Plus, Send } from 'lucide-react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { askChatQuestion, getChatHistory, getConversations } from '../service/chatService'
import { listDocuments } from '../service/documentService'
import { getAnalysisResults } from '../service/analysisService'
import type { AnalysisResultListItem, ChatContextType, ConversationSummary, DocumentItem } from '../types/api'
import { Card, EmptyState, Input, LoadingRow, PageHeader, Select } from '../components/ui'
import { cn } from '../lib/cn'

const CHAT_SESSION_STORAGE_KEY = 'medical_ai_chat_session_v1'

type GroundingMode = 'general' | ChatContextType

type ChatMessage = {
  role: string
  content: string
  confidence: number | null
  created_at: string
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(date)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function ChatPage() {
  const { request } = useAuth()
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY),
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [groundingMode, setGroundingMode] = useState<GroundingMode>('general')
  const [groundingId, setGroundingId] = useState('')
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultListItem[]>([])
  const [activeContextLabel, setActiveContextLabel] = useState<string | null>(null)

  useEffect(() => {
    listDocuments(request)
      .then(setDocuments)
      .catch(() => {
        // Grounding picker is optional; ignore failures silently.
      })
    getAnalysisResults(request)
      .then(setAnalysisResults)
      .catch(() => {
        // Grounding picker is optional; ignore failures silently.
      })
  }, [request])

  const loadConversations = useCallback(() => {
    setIsLoadingConversations(true)
    getConversations(request)
      .then((result) => setConversations(result))
      .catch(() => {
        // Conversation list is a convenience sidebar; ignore failures silently.
      })
      .finally(() => setIsLoadingConversations(false))
  }, [request])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const selectConversation = useCallback(
    (nextSessionId: string) => {
      setMessages([])
      setStatus('')
      setSessionId(nextSessionId)
      sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, nextSessionId)
      const conversation = conversations.find((c) => c.session_id === nextSessionId)
      setActiveContextLabel(conversation?.context_label ?? null)
    },
    [conversations],
  )

  const startNewConversation = useCallback(() => {
    setMessages([])
    setStatus('')
    setSessionId(null)
    setActiveContextLabel(null)
    setGroundingMode('general')
    setGroundingId('')
    sessionStorage.removeItem(CHAT_SESSION_STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (!sessionId) {
      return
    }

    let cancelled = false
    setIsLoadingHistory(true)

    getChatHistory(request, sessionId)
      .then((history) => {
        if (!cancelled) {
          setMessages(history.messages)
        }
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingHistory(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [request, sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmed = question.trim()
      if (!trimmed || isSending) {
        return
      }

      const userMessage: ChatMessage = {
        role: 'user',
        content: trimmed,
        confidence: null,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setQuestion('')
      setIsSending(true)
      setStatus('')

      try {
        const response = await askChatQuestion(request, {
          question: trimmed,
          session_id: sessionId ?? undefined,
          ...(!sessionId && groundingMode !== 'general' && groundingId
            ? { context_type: groundingMode, context_id: groundingId }
            : {}),
        })

        if (response.session_id !== sessionId) {
          setSessionId(response.session_id)
          sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, response.session_id)
        }
        if (response.context_label) {
          setActiveContextLabel(response.context_label)
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.answer,
            confidence: response.confidence,
            created_at: new Date().toISOString(),
          },
        ])

        if (response.warning) {
          setStatus(response.warning.message)
        }

        loadConversations()
      } catch (error) {
        if (error instanceof ApiRequestError) {
          setStatus(`Error ${error.status}: ${error.message}`)
        } else if (error instanceof Error) {
          setStatus(error.message)
        } else {
          setStatus('Unable to send your message')
        }
      } finally {
        setIsSending(false)
      }
    },
    [groundingId, groundingMode, isSending, loadConversations, question, request, sessionId],
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Chat" description="Chat with the AI about your medical documents here." />

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <Card padded={false} className="flex flex-col lg:w-72 lg:shrink-0">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
            <button
              type="button"
              onClick={startNewConversation}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '60vh' }}>
            {isLoadingConversations ? <LoadingRow label="Loading conversations..." /> : null}

            {!isLoadingConversations && conversations.length === 0 ? (
              <EmptyState icon={MessageCircle} title="No conversations yet." className="border-none bg-transparent py-6" />
            ) : null}

            {conversations.map((conversation) => {
              const isActive = conversation.session_id === sessionId
              return (
                <button
                  key={conversation.session_id}
                  type="button"
                  onClick={() => selectConversation(conversation.session_id)}
                  className={cn(
                    'block w-full rounded-lg px-3 py-2 text-left text-sm transition',
                    isActive ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200' : 'text-gray-700 hover:bg-gray-100',
                  )}
                >
                  <p className="truncate font-medium">{conversation.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(conversation.updated_at)}</p>
                  {conversation.context_label ? (
                    <p className="mt-0.5 truncate text-xs text-primary-600">{conversation.context_label}</p>
                  ) : null}
                </button>
              )
            })}
          </div>
        </Card>

        <Card padded={false} className="flex flex-1 flex-col">
          {sessionId === null ? (
            <div className="flex flex-col gap-2 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:gap-3 sm:p-5">
              <Select
                value={groundingMode}
                onChange={(event) => {
                  setGroundingMode(event.target.value as GroundingMode)
                  setGroundingId('')
                }}
                className="sm:w-56"
              >
                <option value="general">General chat</option>
                <option value="document">Grounded in a document</option>
                <option value="analysis_result">Grounded in an analysis result</option>
              </Select>
              {groundingMode === 'document' ? (
                <Select value={groundingId} onChange={(event) => setGroundingId(event.target.value)} className="sm:w-64">
                  <option value="">Select a document...</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.file_name}
                    </option>
                  ))}
                </Select>
              ) : null}
              {groundingMode === 'analysis_result' ? (
                <Select value={groundingId} onChange={(event) => setGroundingId(event.target.value)} className="sm:w-64">
                  <option value="">Select an analysis result...</option>
                  {analysisResults.map((result) => (
                    <option key={result.id} value={result.id}>
                      {result.title}
                    </option>
                  ))}
                </Select>
              ) : null}
            </div>
          ) : activeContextLabel ? (
            <div className="border-b border-gray-200 px-5 py-2 text-xs font-medium text-primary-700 sm:px-6">
              Grounded in: {activeContextLabel}
            </div>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6" style={{ minHeight: '20rem', maxHeight: '60vh' }}>
            {isLoadingHistory ? <LoadingRow label="Loading conversation..." /> : null}

            {!isLoadingHistory && messages.length === 0 ? (
              <EmptyState icon={MessageCircle} title="Ask a question to start the conversation." className="border-none bg-transparent" />
            ) : null}

            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              return (
                <div key={`${message.created_at}-${index}`} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                      isUser ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={cn('mt-1 flex items-center gap-2 text-xs', isUser ? 'text-white/70' : 'text-gray-500')}>
                      <span>{formatTime(message.created_at)}</span>
                      {!isUser && message.confidence !== null ? (
                        <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {status ? <p className="px-5 pb-2 text-sm text-amber-700 sm:px-6">{status}</p> : null}

          <form onSubmit={onSubmit} className="flex items-center gap-3 border-t border-gray-200 p-4 sm:p-5">
            <Input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your medical documents..."
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={
                isSending ||
                !question.trim() ||
                (sessionId === null && groundingMode !== 'general' && !groundingId)
              }
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
