import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

const SIZES = {
  sm: { box: 'size-7', icon: 'size-3.5' },
  md: { box: 'size-8', icon: 'size-4' },
  lg: { box: 'size-12', icon: 'size-6' },
} as const

interface BrandMarkProps {
  size?: keyof typeof SIZES
  className?: string
}

/** The app's mark: a sparkle on a flat accent tile. Decorative only. */
export function BrandMark({ size = 'md', className }: BrandMarkProps) {
  const { box, icon } = SIZES[size]

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-brand shadow-sm',
        box,
        className,
      )}
    >
      <Sparkles className={icon} />
    </span>
  )
}
