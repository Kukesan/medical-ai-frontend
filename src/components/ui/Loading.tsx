import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-100', className)} />
}

export function SkeletonLines({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={cn('h-4', index === count - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

export function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
      <Spinner />
      {label}
    </div>
  )
}
