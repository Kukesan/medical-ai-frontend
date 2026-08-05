import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { askChatQuestion, getChatHistory, getConversations } from '../service/chatService'
import type { ConversationSummary } from '../types/api'

const CHAT_SESSION_STORAGE_KEY = 'medical_ai_chat_session_v1'

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

  const selectConversation = useCallback((nextSessionId: string) => {
    setMessages([])
    setStatus('')
    setSessionId(nextSessionId)
    sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, nextSessionId)
  }, [])

  const startNewConversation = useCallback(() => {
    setMessages([])
    setStatus('')
    setSessionId(null)
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
        })

        if (response.session_id !== sessionId) {
          setSessionId(response.session_id)
          sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, response.session_id)
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
    [isSending, loadConversations, question, request, sessionId],
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="mt-2 text-sm text-gray-600">Chat with the AI about your medical documents here.</p>
      </section>

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <section className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm lg:w-72 lg:shrink-0">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
            <button
              type="button"
              onClick={startNewConversation}
              className="rounded-lg bg-[#AA1C41] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8C1636]"
            >
              New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '60vh' }}>
            {isLoadingConversations ? <p className="p-2 text-sm text-gray-600">Loading conversations...</p> : null}

            {!isLoadingConversations && conversations.length === 0 ? (
              <p className="p-2 text-sm text-gray-600">No conversations yet.</p>
            ) : null}

            {conversations.map((conversation) => {
              const isActive = conversation.session_id === sessionId
              return (
                <button
                  key={conversation.session_id}
                  type="button"
                  onClick={() => selectConversation(conversation.session_id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive ? 'bg-[#AA1C41]/10 text-[#AA1C41]' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <p className="truncate font-medium">{conversation.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(conversation.updated_at)}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6" style={{ minHeight: '20rem', maxHeight: '60vh' }}>
            {isLoadingHistory ? <p className="text-sm text-gray-600">Loading conversation...</p> : null}

            {!isLoadingHistory && messages.length === 0 ? (
              <p className="text-sm text-gray-600">Ask a question to start the conversation.</p>
            ) : null}

            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              return (
                <div key={`${message.created_at}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      isUser ? 'bg-[#AA1C41] text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={`mt-1 flex items-center gap-2 text-xs ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
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
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your medical documents..."
              disabled={isSending}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={isSending || !question.trim()}
              className="rounded-lg bg-[#AA1C41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8C1636] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
