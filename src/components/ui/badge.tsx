import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'outline'

const variants: Record<Variant, string> = {
  default: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
  success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  outline: 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200',
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}
      {...props}
    />
  )
}
