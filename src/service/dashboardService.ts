import type { AuthRequest } from '../context/auth-request'
import type { AlertItem, LabTrendsResponse, TimelineResponse } from '../types/api'

export function getTimeline(request: AuthRequest) {
  return request<TimelineResponse>('/timeline')
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