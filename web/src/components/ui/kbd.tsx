import { cn } from '@/lib/utils'

/** A keyboard key hint, e.g. <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border px-1 font-sans text-[10px] font-medium text-muted-foreground glass-border bg-foreground/[0.04]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
