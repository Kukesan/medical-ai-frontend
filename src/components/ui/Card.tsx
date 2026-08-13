import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & { padded?: boolean }

export function Card({ className, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl border border-gray-200 bg-white shadow-sm', padded && 'p-5 sm:p-6', className)}
      {...props}
    />
  )
}
