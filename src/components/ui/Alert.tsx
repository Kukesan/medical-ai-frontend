import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../lib/cn'
import { isKnownErrorMessage } from '../../lib/describeError'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const toneConfig: Record<AlertTone, { container: string; icon: typeof Info }> = {
  info: { container: 'border-sky-100 bg-sky-50/70 text-sky-800', icon: Info },
  success: { container: 'border-emerald-100 bg-emerald-50/70 text-emerald-800', icon: CheckCircle2 },
  warning: { container: 'border-amber-100 bg-amber-50/70 text-amber-800', icon: AlertTriangle },
  danger: { container: 'border-red-100 bg-red-50/70 text-red-800', icon: AlertCircle },
}

export function Alert({ tone = 'info', children, className }: { tone?: AlertTone; children: ReactNode; className?: string }) {
  const { container, icon: Icon } = toneConfig[tone]

  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm animate-fade-in', container, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  )
}

export function inferStatusTone(message: string): AlertTone {
  const lower = message.toLowerCase()

  if (isKnownErrorMessage(message) || lower.startsWith('error') || lower.includes('unable to') || lower.includes('failed') || lower.includes('fail')) {
    return 'danger'
  }

  if (
    lower.includes('success') ||
    lower.includes('added') ||
    lower.includes('updated') ||
    lower.includes('deleted') ||
    lower.includes('complete') ||
    lower.includes('welcome')
  ) {
    return 'success'
  }

  return 'info'
}
