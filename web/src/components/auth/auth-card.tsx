import { cn } from '@/lib/utils'

interface AuthCardProps {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        'glass rounded-2xl border p-6 shadow-[0_24px_70px_-30px_hsl(var(--aurora-1)/0.55)]',
        className,
      )}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {children}

      {footer && (
        <div className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground glass-border">
          {footer}
        </div>
      )}
    </div>
  )
}
