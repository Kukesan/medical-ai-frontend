import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type FieldProps = {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, required, hint, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">
        {label}
        {required ? <span className="ml-0.5 text-primary-600">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}
