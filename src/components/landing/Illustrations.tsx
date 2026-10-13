import type { ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Pill,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
} from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Product previews for the landing page, built from markup instead of screenshots so they stay sharp,
 * weigh almost nothing and never show real patient data. Every preview carries an "illustrative" caption.
 */

function Frame({ caption, className, children }: { caption: string; className?: string; children: ReactNode }) {
  return (
    <figure className={cn('w-full', className)}>
      <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-pop sm:p-5">{children}</div>
      <figcaption className="mt-3 text-center text-xs text-gray-500">{caption}</figcaption>
    </figure>
  )
}

function Bubble({ from, children }: { from: 'user' | 'assistant'; children: ReactNode }) {
  return (
    <div className={cn('flex', from === 'user' ? 'justify-end' : 'justify-start')}>
      <p
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          from === 'user' ? 'rounded-br-md bg-primary-600 text-white' : 'rounded-bl-md bg-gray-100 text-gray-800',
        )}
      >
        {children}
      </p>
    </div>
  )
}

/** Hero preview: a document becomes extracted details, an interaction finding and a grounded answer. */
export function HeroPreview() {
  return (
    <Frame caption="Illustrative example. Not real patient data." className="mx-auto max-w-md">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">prescription-march.pdf</p>
          <p className="text-xs text-gray-500">Prescription · 2 medications found</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Extracted
        </span>
      </div>

      <dl className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
        {[
          { name: 'Warfarin', dose: '5 mg · once daily' },
          { name: 'Ibuprofen', dose: '400 mg · as needed' },
        ].map((med) => (
          <div key={med.name} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <dt className="flex items-center gap-2 font-medium text-gray-900">
              <Pill className="h-4 w-4 text-primary-500" aria-hidden="true" />
              {med.name}
            </dt>
            <dd className="text-gray-500">{med.dose}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Medium risk · Medication interaction
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-900">
          Ibuprofen may increase the risk of bleeding when taken with warfarin. Confirm with your doctor or
          pharmacist.
        </p>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4">
        <Bubble from="user">What should I ask my doctor about this?</Bubble>
        <Bubble from="assistant">
          You could ask whether another pain reliever would suit you better alongside warfarin, and whether any extra
          monitoring is needed.
        </Bubble>
        <p className="flex items-center gap-1.5 pl-1 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" />
          Answer based on prescription-march.pdf
        </p>
      </div>
    </Frame>
  )
}

/** Guided intake: free text in, a follow-up question for a missing detail, a record to confirm. */
export function IntakePreview() {
  return (
    <Frame caption="Illustrative example of a guided record entry.">
      <div className="space-y-2.5">
        <Bubble from="user">I got my flu vaccine at the pharmacy last week.</Bubble>
        <Bubble from="assistant">Thanks. Do you remember the exact date? An approximate one is fine.</Bubble>
        <Bubble from="user">Monday the 6th, I think.</Bubble>
      </div>
      <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50/60 p-3.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-800">
          <Syringe className="h-4 w-4" aria-hidden="true" />
          Vaccination record ready to review
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Vaccine</dt>
          <dd className="text-gray-900">Influenza</dd>
          <dt className="text-gray-500">Date</dt>
          <dd className="text-gray-900">6 Oct</dd>
          <dt className="text-gray-500">Given at</dt>
          <dd className="text-gray-900">Pharmacy</dd>
        </dl>
        <div className="mt-3 flex gap-2" aria-hidden="true">
          <span className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white">Confirm</span>
          <span className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
            Edit
          </span>
        </div>
      </div>
    </Frame>
  )
}

const timelineEvents = [
  { icon: Stethoscope, title: 'GP visit · Persistent cough', date: 'Sep' },
  { icon: Activity, title: 'Blood test · Full blood count', date: 'Jul' },
  { icon: Syringe, title: 'Vaccination · Influenza', date: 'Mar' },
]

/** Timeline and vitals: history in date order beside a simple blood-pressure trend. */
export function TimelinePreview() {
  return (
    <Frame caption="Illustrative example of the timeline and vitals history.">
      <ol className="relative space-y-4 pl-1">
        {timelineEvents.map((event, index) => (
          <li key={event.title} className="relative flex items-start gap-3">
            {index < timelineEvents.length - 1 ? (
              <span className="absolute left-4 top-9 h-[calc(100%-1.25rem)] w-px bg-gray-200" aria-hidden="true" />
            ) : null}
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-4 ring-white">
              <event.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-1">
              <p className="truncate text-sm font-medium text-gray-900">{event.title}</p>
              <p className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {event.date}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-xl border border-gray-100 p-3.5">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Blood pressure</p>
          <p className="text-sm font-semibold text-gray-900">
            124/80 <span className="font-normal text-gray-500">mmHg</span>
          </p>
        </div>
        <svg viewBox="0 0 240 48" className="mt-2 h-12 w-full" aria-hidden="true" preserveAspectRatio="none">
          <polyline
            points="0,18 40,22 80,14 120,24 160,20 200,28 240,26"
            fill="none"
            stroke="var(--color-primary-500)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </Frame>
  )
}

/** Doctor guidance: a finding that needs attention leads to a specialty and nearby clinics. */
export function DoctorPreview() {
  return (
    <Frame caption="Illustrative example. Clinic names are fictional.">
      <div className="rounded-xl border border-red-100 bg-red-50/70 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">High risk finding</p>
        <p className="mt-1 text-sm text-red-900">Suggested specialty: Cardiology</p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500">
        <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
        Colombo · this week, evenings
      </div>

      <ul className="mt-3 space-y-2">
        {[
          { name: 'Lakeside Heart Clinic', distance: '2.1 km', rating: '4.7' },
          { name: 'Harbour Cardiology Centre', distance: '4.8 km', rating: '4.5' },
        ].map((clinic) => (
          <li key={clinic.name} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{clinic.name}</p>
              <p className="text-xs text-gray-500">Cardiology · {clinic.distance} away</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-700">
              <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" aria-hidden="true" />
              {clinic.rating}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Check availability directly with the clinic.
      </p>
    </Frame>
  )
}
