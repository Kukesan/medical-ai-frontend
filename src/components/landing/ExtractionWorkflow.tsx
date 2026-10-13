import type { ReactNode } from 'react'
import { ArrowDown, ArrowRight, Check, CheckCircle2, FileText, Pencil, ScanText, UploadCloud } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Landing page flow diagram of the real document pipeline (see DocumentDetailsPage):
 * upload → OCR + AI extraction → user review, edit and accept.
 * All patient, clinic and doctor details are fictional and the section is captioned as an example.
 */

type Medication = { name: string; written: string; dose: string; frequency: string; duration: string }

// One fictional prescription, shown on paper in step 1 and as data in steps 2 and 3.
const prescription = {
  clinic: 'Northgate Family Clinic',
  doctor: 'Dr. N. Fernando',
  date: '14/03/2026',
  dateLong: '14 Mar 2026',
  diagnosis: 'Acute sinusitis',
  medications: [
    {
      name: 'Amoxicillin',
      written: 'Amoxicillin 500mg cap — 1 TDS x 7/7',
      dose: '500 mg',
      frequency: '3 times daily',
      duration: '7 days',
    },
    {
      name: 'Paracetamol',
      written: 'Paracetamol 500mg tab — 2 QDS PRN x 5/7',
      dose: '1 g (2 tabs)',
      frequency: 'Every 6 h, as needed',
      duration: '5 days',
    },
    {
      name: 'Cetirizine',
      written: 'Cetirizine 10mg tab — 1 nocte x 5/7',
      dose: '10 mg',
      frequency: 'Once at night',
      duration: '5 days',
    },
  ] satisfies Medication[],
}

/** Step 1 visual: the uploaded PDF, rendered as a paper prescription. */
function SamplePdf() {
  return (
    <div>
      <div className="rounded-xl border-2 border-dashed border-primary-200 bg-white/70 p-3">
        <article
          aria-label="Sample prescription PDF"
          className="rounded-md bg-white px-4 pb-4 pt-3.5 text-[11px] leading-snug text-gray-700 shadow-pop ring-1 ring-gray-900/5"
        >
          <header className="flex items-start justify-between gap-2 border-b-2 border-primary-600 pb-2">
            <div>
              <p className="text-[13px] font-bold text-primary-800">{prescription.clinic}</p>
              <p className="text-[10px] text-gray-500">General Practice · Outpatient</p>
            </div>
            <p className="shrink-0 text-[10px] text-gray-500">Date: {prescription.date}</p>
          </header>

          <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
            <dt className="text-gray-500">Patient:</dt>
            <dd>Sample Patient, 42 y</dd>
            <dt className="text-gray-500">Dx:</dt>
            <dd className="font-serif italic text-gray-900">{prescription.diagnosis}</dd>
          </dl>

          <p className="mt-2.5 font-serif text-xl font-bold italic leading-none text-primary-800" aria-hidden="true">
            Rx
          </p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 font-serif italic text-gray-900">
            {prescription.medications.map((med) => (
              <li key={med.name}>{med.written}</li>
            ))}
          </ol>

          <footer className="mt-4 flex justify-end">
            <div className="text-center">
              <p className="font-serif text-sm italic text-primary-900">N. Fernando</p>
              <p className="mt-0.5 border-t border-gray-300 pt-0.5 text-[10px] text-gray-500">{prescription.doctor}</p>
            </div>
          </footer>
        </article>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold text-red-600">
          PDF
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">prescription-northgate.pdf</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-primary-500" />
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Uploaded
        </span>
      </div>
    </div>
  )
}

/** Marks the parts of the recognized text that extraction picks up. */
function Hit({ children }: { children: ReactNode }) {
  return <mark className="rounded-sm bg-accent-100 px-0.5 text-gray-900">{children}</mark>
}

const pipeline = ['Uploaded', 'Text recognized (OCR)', 'Details extracted']

/** Step 2 visual: pipeline progress, OCR text with highlighted findings, and the structured result. */
function ExtractionVisual() {
  return (
    <div className="space-y-3">
      <ol className="rounded-xl border border-gray-200/80 bg-white p-3" aria-label="Processing status">
        {pipeline.map((stage) => (
          <li key={stage} className="flex items-center gap-2 py-1 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            {stage}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-gray-200/80 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Recognized text</p>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-gray-600">
          <Hit>{prescription.clinic}</Hit> · Date: <Hit>{prescription.date}</Hit> · Dx: <Hit>{prescription.diagnosis}</Hit>{' '}
          · Rx 1. <Hit>Amoxicillin 500mg</Hit> cap 1 <Hit>TDS x 7/7</Hit> 2. <Hit>Paracetamol 500mg</Hit> tab 2{' '}
          <Hit>QDS PRN x 5/7</Hit> 3. <Hit>Cetirizine 10mg</Hit> tab 1 <Hit>nocte x 5/7</Hit> · <Hit>{prescription.doctor}</Hit>
        </p>
      </div>

      <div className="flex justify-center text-primary-400" aria-hidden="true">
        <ArrowDown className="h-4 w-4" />
      </div>

      <div className="rounded-xl border border-primary-100 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">Structured details</p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-500">Visit date</dt>
          <dd className="text-gray-900">{prescription.dateLong}</dd>
          <dt className="text-gray-500">Doctor</dt>
          <dd className="text-gray-900">{prescription.doctor}</dd>
          <dt className="text-gray-500">Clinic</dt>
          <dd className="text-gray-900">{prescription.clinic}</dd>
          <dt className="text-gray-500">Diagnosis</dt>
          <dd className="text-gray-900">{prescription.diagnosis}</dd>
          <dt className="text-gray-500">Medications</dt>
          <dd className="text-gray-900">{prescription.medications.length} found</dd>
        </dl>
      </div>
    </div>
  )
}

/** Step 3 visual: the extracted medications, one corrected by the user, ready to accept. */
function ReviewVisual() {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">Review extracted details</p>
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">Edited by you</span>
      </div>

      <ul className="mt-3 space-y-2">
        {prescription.medications.map((med) => {
          const corrected = med.name === 'Paracetamol'
          return (
            <li
              key={med.name}
              className={cn(
                'rounded-lg border p-2.5',
                corrected ? 'border-sky-200 bg-sky-50/50' : 'border-gray-100',
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                <p className="text-xs text-gray-500">{med.dose}</p>
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-600">
                {med.frequency} ·
                {corrected ? (
                  <>
                    <span className="text-gray-400 line-through">3 days</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-800">
                      <Pencil className="h-3 w-3" aria-hidden="true" />
                      {med.duration}
                    </span>
                  </>
                ) : (
                  <span>{med.duration}</span>
                )}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex gap-2" aria-hidden="true">
        <span className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-xs font-semibold text-gray-700">
          Edit
        </span>
        <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white">
          <Check className="h-3.5 w-3.5" />
          Accept
        </span>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs leading-relaxed text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Accepted. The assistant can now use this prescription to answer your questions.
      </p>
    </div>
  )
}

type Step = {
  icon: typeof UploadCloud
  title: string
  description: string
  visual: ReactNode
}

const steps: Step[] = [
  {
    icon: UploadCloud,
    title: 'Upload your document',
    description: 'Add a prescription, lab report or discharge note as a PDF, PNG or JPEG. A phone photo works too.',
    visual: <SamplePdf />,
  },
  {
    icon: ScanText,
    title: 'Text recognition and extraction',
    description:
      'OCR reads the text on the page, then AI turns it into structured details: visit date, doctor, diagnosis and medications.',
    visual: <ExtractionVisual />,
  },
  {
    icon: FileText,
    title: 'Check, correct and accept',
    description:
      'AI can misread handwriting, so you review every detail, fix anything that is wrong and accept when it matches your document.',
    visual: <ReviewVisual />,
  },
]

export function ExtractionWorkflow() {
  return (
    <section id="workflow" aria-labelledby="workflow-heading" className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent-700">See it in action</p>
          <h2 id="workflow-heading" className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From a paper prescription to a record you can trust
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            Every document goes through the same three steps. Nothing is final until you have checked it.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-16">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1
            return (
              <li key={step.title} className="relative flex flex-col">
                {/* Flow rail: numbered node, then a connector line and arrow towards the next step. */}
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-brand">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                    Step {index + 1}
                  </span>
                  {!isLast ? (
                    <span className="ml-1 hidden h-px flex-1 border-t-2 border-dashed border-primary-200 lg:block" aria-hidden="true" />
                  ) : null}
                </div>
                {!isLast ? (
                  <span
                    className="absolute -right-12 top-1.5 hidden h-8 w-8 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-600 lg:flex"
                    aria-hidden="true"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : null}

                <h3 className="mt-4 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.description}</p>
                <div className="mt-5 flex-1 rounded-2xl bg-canvas p-4">{step.visual}</div>

                {!isLast ? (
                  <span className="mt-6 flex justify-center text-primary-400 lg:hidden" aria-hidden="true">
                    <ArrowDown className="h-6 w-6" />
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>

        <p className="mt-8 text-center text-xs text-gray-500">
          Illustrative example. The clinic, doctor and patient are fictional.
        </p>
      </div>
    </section>
  )
}
