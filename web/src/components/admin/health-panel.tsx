'use client'

import { formatDistanceToNow } from 'date-fns'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAdminHealth } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'
import type { CheckStatus } from '@/types/admin'

const STATUS: Record<CheckStatus, { label: string; dot: string }> = {
  ok: { label: 'OK', dot: 'bg-emerald-500' },
  degraded: { label: 'Degraded', dot: 'bg-amber-500' },
  down: { label: 'Down', dot: 'bg-red-500' },
  off: { label: 'Off', dot: 'bg-muted-foreground/40' },
}

export function HealthPanel() {
  const health = useAdminHealth()
  const data = health.data

  return (
    <section aria-labelledby="health-heading" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="health-heading" className="text-base font-semibold">
            Health
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `Checked ${formatDistanceToNow(new Date(data.checkedAt), { addSuffix: true })}; refreshes every 30 seconds.`
              : 'Each service, checked from the web app.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void health.refetch()}
          disabled={health.isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={cn('size-3.5', health.isFetching && 'animate-spin')} />
          Check now
        </Button>
      </div>

      {health.isError && (
        <p role="alert" className="text-sm text-destructive">
          Could not run the checks: {health.error.message}
        </p>
      )}

      {data && (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.checks.map((check) => (
              <li key={check.name} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{check.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span aria-hidden="true" className={cn('size-2 rounded-full', STATUS[check.status].dot)} />
                    {STATUS[check.status].label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{check.detail}</p>
              </li>
            ))}
          </ul>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Users', data.counts.users],
              ['Chats', data.counts.chats],
              ['Active API keys', data.counts.apiKeys],
              ['Indexed chunks', data.counts.indexedChunks ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-card p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  )
}
