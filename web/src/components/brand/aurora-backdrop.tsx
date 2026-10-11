import { cn } from '@/lib/utils'

/**
 * The slow-moving aurora behind the app: three soft colour fields drifting on
 * long, offset loops plus a fading dot grid. Pure CSS (globals.css), animating
 * transforms only; frozen under prefers-reduced-motion. Place it first inside
 * a `relative isolate` container so content stacks above it.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('aurora-backdrop -z-10', className)}>
      <div className="aurora-blob aurora-blob-a" />
      <div className="aurora-blob aurora-blob-b" />
      <div className="aurora-blob aurora-blob-c" />
      <div className="aurora-grid" />
    </div>
  )
}
