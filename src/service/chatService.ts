import type { AuthRequest } from '../context/auth-request'
import type { ChatHistoryResponse, ChatResponse } from '../types/api'

export function askChatQuestion(
  request: AuthRequest,
  payload: { question: string; session_id?: string },
) {
  return request<ChatResponse>('/consultant', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getChatHistory(request: AuthRequest, sessionId: string) {
  return request<ChatHistoryResponse>(`/consultant/history?session_id=${encodeURIComponent(sessionId)}`)
}