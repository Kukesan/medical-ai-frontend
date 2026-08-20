import type { AuthRequest } from '../context/auth-request'
import type { ChatContextType, ChatHistoryResponse, ChatResponse, ConversationSummary } from '../types/api'

export function getConversations(request: AuthRequest) {
  return request<ConversationSummary[]>('/consultant/conversations')
}

export function askChatQuestion(
  request: AuthRequest,
  payload: {
    question: string
    session_id?: string
    context_type?: ChatContextType
    context_id?: string
  },
) {
  return request<ChatResponse>('/consultant', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getChatHistory(request: AuthRequest, sessionId: string) {
  return request<ChatHistoryResponse>(`/consultant/history?session_id=${encodeURIComponent(sessionId)}`)
}