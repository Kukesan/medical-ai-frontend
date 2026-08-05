import type { AuthRequest } from '../context/auth-request'
import type { TimelineEntry } from '../types/api'

export function listTimeline(request: AuthRequest) {
  return request<TimelineEntry[]>('/timeline/list')
}
