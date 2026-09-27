import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

const toneClasses: Record<BadgeTone, string> = {
  primary: 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200/70',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/70',
  neutral: 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function riskTone(riskLevel: string): BadgeTone {
  switch (riskLevel.toLowerCase()) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'neutral'
  }
}

export function trendTone(direction: string): BadgeTone {
  switch (direction.toLowerCase()) {
    case 'up':
    case 'increasing':
      return 'danger'
    case 'down':
    case 'decreasing':
      return 'warning'
    case 'stable':
      return 'success'
    default:
      return 'neutral'
  }
}
