import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

const SIZES = {
  sm: { box: 'size-7', icon: 'size-3.5' },
  md: { box: 'size-8', icon: 'size-4' },
  lg: { box: 'size-14', icon: 'size-7' },
} as const

interface BrandMarkProps {
  size?: keyof typeof SIZES
  /** Adds a light sweeping around the edge, e.g. while an answer streams. */
  animated?: boolean
  className?: string
}

/**
 * The app's mark: a sparkle on an aurora-gradient tile. When `animated`, a
 * conic highlight orbits its border; the orbiting layer is oversized and
 * clipped by the tile, so only the 1.5px rim shows. Decorative only.
 */
export function BrandMark({ size = 'md', animated = false, className }: BrandMarkProps) {
  const { box, icon } = SIZES[size]

  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-[30%] shadow-[0_8px_24px_-8px_hsl(var(--aurora-1)/0.8)]',
        animated && 'p-[1.5px]',
        box,
        className,
      )}
    >
      {animated && (
        <span className="absolute inset-[-50%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,white_320deg,transparent_360deg)]" />
      )}
      <span className="relative flex size-full items-center justify-center rounded-[inherit] bg-aurora">
        <Sparkles className={cn('text-white drop-shadow-sm', icon)} />
      </span>
    </span>
  )
}
