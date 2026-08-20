import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin, Phone, Star, Stethoscope } from 'lucide-react'
import type { AnalysisResultItem, DoctorResult } from '../types/api'
import { ApiRequestError } from '../lib/ApiRequestError'
import { useAuth } from '../context/useAuth'
import { getAnalysisResult } from '../service/analysisService'
import { searchDoctors } from '../service/doctorRecommendationService'
import { Alert, Badge, Button, Card, Field, Input, LoadingRow, riskTone } from '../components/ui'

const LOW_CONFIDENCE_THRESHOLD = 0.8

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatRiskLabel(riskLevel: string) {
  return riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)
}

function formatCategory(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AnalysisResultDetailsPage() {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const { request } = useAuth()

  const [result, setResult] = useState<AnalysisResultItem | null>(null)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [location, setLocation] = useState('')
  const [availability, setAvailability] = useState('')
  const [doctorSpecialty, setDoctorSpecialty] = useState('')
  const [doctors, setDoctors] = useState<DoctorResult[] | null>(null)
  const [doctorMessage, setDoctorMessage] = useState('')
  const [doctorStatus, setDoctorStatus] = useState('')
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false)

  const loadResult = useCallback(async () => {
    if (!resultId) return
    setIsLoading(true)
    setStatus('')
    try {
      const data = await getAnalysisResult(request, resultId)
      setResult(data)
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setStatus(error.message)
      } else {
        setStatus('Unable to load analysis result.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [request, resultId])

  useEffect(() => {
    void loadResult()
  }, [loadResult])

  useEffect(() => {
    if (isLoading || !result || routerLocation.hash !== '#doctor-recommendation') return
    document.getElementById('doctor-recommendation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isLoading, result, routerLocation.hash])

  const handleDoctorSearch = useCallback(async () => {
    if (!result || !location.trim() || !availability.trim()) return
    setIsSearchingDoctors(true)
    setDoctorStatus('')
    try {
      const data = await searchDoctors(request, {
        analysis_result_id: result.id,
        location: location.trim(),
        availability: availability.trim(),
      })
      setDoctorSpecialty(data.specialty)
      setDoctors(data.doctors)
      setDoctorMessage(data.message ?? '')
    } catch (error) {
      setDoctors(null)
      if (error instanceof ApiRequestError) {
        setDoctorStatus(`Error ${error.status}: ${error.message}`)
      } else if (error instanceof Error) {
        setDoctorStatus(error.message)
      } else {
        setDoctorStatus('Unable to search for nearby doctors.')
      }
    } finally {
      setIsSearchingDoctors(false)
    }
  }, [availability, location, request, result])

  const needsDoctorRecommendation =
    !!result && (result.risk_level === 'high' || result.risk_level === 'medium' || result.confidence < LOW_CONFIDENCE_THRESHOLD)

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => navigate('/analyze')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="font-display text-2xl text-gray-900">Analysis Detail</h1>
      </div>

      {isLoading ? <LoadingRow label="Loading analysis result..." /> : null}
      {!isLoading && status ? <Alert tone="danger">{status}</Alert> : null}

      {!isLoading && result ? (
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{result.title}</h2>
              <p className="mt-1 text-sm text-gray-600">
                {formatCategory(result.category)} • Created {formatDate(result.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {needsDoctorRecommendation ? (
                <span
                  title="Doctor recommendation suggested"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600"
                >
                  <Stethoscope className="h-4 w-4" />
                </span>
              ) : null}
              <Badge tone={riskTone(result.risk_level)}>{formatRiskLabel(result.risk_level)} Risk</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Confidence:</span> {Math.round(result.confidence * 100)}%
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Recommendation:</span> {result.recommendation}
            </p>
          </div>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Description</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">{result.description}</p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Clinical Reason</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">{result.clinical_reason}</p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Timeline</h3>
            {result.timeline.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No timeline entries.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {result.timeline.map((item, index) => (
                  <div key={`${item.document_id}-${item.date}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                    <p className="mt-1 text-sm text-gray-700">{item.finding}</p>
                    <p className="mt-2 text-xs text-gray-500">Document: {item.document_id}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-900">Evidence</h3>
            {result.evidence.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No evidence snippets.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {result.evidence.map((item, index) => (
                  <div key={`${item.document_id}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-sm text-gray-700">{item.snippet}</p>
                    <p className="mt-2 text-xs text-gray-500">Document: {item.document_id}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Card>
      ) : null}

      {!isLoading && result && needsDoctorRecommendation ? (
        <Card id="doctor-recommendation" className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Find a Nearby Doctor</h2>
            <p className="mt-1 text-sm text-gray-600">
              This finding is high-risk or low-confidence. Tell us where you are and when you're free, and we'll
              look for real doctors and clinics nearby.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Location" htmlFor="doctor-location" required>
              <Input
                id="doctor-location"
                placeholder="e.g. Colombo, or your area"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </Field>
            <Field label="Availability" htmlFor="doctor-availability" required>
              <Input
                id="doctor-availability"
                placeholder="e.g. this week, evenings"
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
              />
            </Field>
          </div>

          <Button
            onClick={() => void handleDoctorSearch()}
            isLoading={isSearchingDoctors}
            disabled={!location.trim() || !availability.trim()}
          >
            Search
          </Button>

          {doctorStatus ? <Alert tone="danger">{doctorStatus}</Alert> : null}

          {!doctorStatus && doctors && doctors.length === 0 ? (
            <Alert tone="warning">{doctorMessage || 'No doctors found nearby.'}</Alert>
          ) : null}

          {!doctorStatus && doctors && doctors.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {doctorSpecialty} near you • Preferred availability: {availability}
              </p>
              {doctors.map((doctor, index) => (
                <div key={`${doctor.name}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{doctor.name}</p>
                    <Badge tone="neutral">{doctor.specialty}</Badge>
                  </div>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-700">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {doctor.address}
                    {doctor.distance_km !== null ? ` • ${doctor.distance_km} km away` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    {doctor.rating !== null ? (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {doctor.rating}
                        {doctor.user_ratings_total !== null ? ` (${doctor.user_ratings_total})` : ''}
                      </span>
                    ) : null}
                    {doctor.phone ? (
                      <a href={`tel:${doctor.phone}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <Phone className="h-3.5 w-3.5" />
                        {doctor.phone}
                      </a>
                    ) : null}
                    {doctor.maps_url ? (
                      <a
                        href={doctor.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View on Maps
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
