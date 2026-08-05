import type { AuthRequest } from '../context/auth-request'
import type { AlertItem, LabTrendsResponse, TimelineEntry } from '../types/api'

export function getTimeline(request: AuthRequest) {
  return request<TimelineEntry[]>('/timeline')
}

export function getMedications(request: AuthRequest) {
  return request<string[]>('/medications')
}

export function getLabTrends(request: AuthRequest) {
  return request<LabTrendsResponse>('/lab-trends')
}

export function getAlerts(request: AuthRequest) {
  return request<AlertItem[]>('/alerts')
}