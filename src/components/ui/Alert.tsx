import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../lib/cn'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const toneConfig: Record<AlertTone, { container: string; icon: typeof Info }> = {
  info: { container: 'border-sky-200 bg-sky-50 text-sky-800', icon: Info },
  success: { container: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
  warning: { container: 'border-amber-200 bg-amber-50 text-amber-800', icon: AlertTriangle },
  danger: { container: 'border-red-200 bg-red-50 text-red-800', icon: AlertCircle },
}

export function Alert({ tone = 'info', children, className }: { tone?: AlertTone; children: ReactNode; className?: string }) {
  const { container, icon: Icon } = toneConfig[tone]

  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm animate-fade-in', container, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  )
}

export function inferStatusTone(message: string): AlertTone {
  const lower = message.toLowerCase()

  if (lower.startsWith('error') || lower.includes('unable to') || lower.includes('failed') || lower.includes('fail')) {
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
