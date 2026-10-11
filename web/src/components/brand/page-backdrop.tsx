import { cn } from '@/lib/utils'

/**
 * A faint, static dot grid behind the auth and share pages (globals.css).
 * Place it first inside a `relative isolate` container so content stacks
 * above it.
 */
export function PageBackdrop({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('page-grid -z-10', className)} />
}
