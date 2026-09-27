import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '../../lib/cn'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-200 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {description ? <p className="max-w-sm text-sm text-gray-500">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
