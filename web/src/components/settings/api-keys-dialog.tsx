'use client'

import { format } from 'date-fns'
import { Check, Copy, KeyRound, Trash2 } from 'lucide-react'
import * as React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/use-api-keys'
import { useCopy } from '@/hooks/use-copy'
import type { ApiKeySummary, CreatedApiKey } from '@/types/api-key'

interface ApiKeysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Personal API keys for /v1, the MCP server and scripts. A key acts as its
 * owner, with the owner's current role; the full key is shown once.
 */
export function ApiKeysDialog({ open, onOpenChange }: ApiKeysDialogProps) {
  const keys = useApiKeys(open)
  const createKey = useCreateApiKey()
  const revokeKey = useRevokeApiKey()

  const [name, setName] = React.useState('')
  const [created, setCreated] = React.useState<CreatedApiKey | null>(null)
  const [revoking, setRevoking] = React.useState<ApiKeySummary | null>(null)

  // Reopening must never show a key from an earlier visit.
  React.useEffect(() => {
    if (!open) {
      setName('')
      setCreated(null)
    }
  }, [open])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createKey.mutate(trimmed, {
      onSuccess: (key) => {
        setCreated(key)
        setName('')
      },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>API keys</DialogTitle>
            <DialogDescription>
              Use a key with the OpenAI-compatible API, the MCP server or a script. It acts as
              you, with your role, until you revoke it.
            </DialogDescription>
          </DialogHeader>

          {created ? (
            <NewKey created={created} onDone={() => setCreated(null)} />
          ) : (
            <form onSubmit={submit} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="api-key-name">New key</Label>
                <Input
                  id="api-key-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Laptop, CI, Claude Desktop"
                  maxLength={64}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={!name.trim() || createKey.isPending}>
                Create
              </Button>
            </form>
          )}

          <section aria-labelledby="api-keys-list" className="mt-2">
            <h3 id="api-keys-list" className="mb-2 text-sm font-medium">
              Your keys
            </h3>
            {keys.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (keys.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No keys yet.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {keys.data?.map((key) => (
                  <li key={key.id} className="flex items-center gap-3 px-3 py-2.5">
                    <KeyRound className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{key.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{key.prefix}…</span>
                        {' · '}created {format(new Date(key.createdAt), 'd MMM yyyy')}
                        {' · '}
                        {key.lastUsedAt
                          ? `last used ${format(new Date(key.lastUsedAt), 'd MMM yyyy')}`
                          : 'never used'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setRevoking(key)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                      <span className="sr-only">Revoke {key.name}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revoking !== null} onOpenChange={(next) => !next && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke “{revoking?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Anything using this key stops working within a minute. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revoking && revokeKey.mutate(revoking.id)}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function NewKey({ created, onDone }: { created: CreatedApiKey; onDone: () => void }) {
  const { copied, copy } = useCopy()
  const [origin, setOrigin] = React.useState('')
  React.useEffect(() => setOrigin(window.location.origin), [])

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-3" role="status">
      <p className="text-sm">
        <span className="font-medium">“{created.name}” is ready.</span> Copy it now: you will not
        see it again.
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={created.key}
          aria-label="New API key"
          className="font-mono text-xs"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" variant="outline" onClick={() => void copy(created.key, 'Key copied')}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-background p-2 font-mono text-[11px] text-muted-foreground">
        {`curl ${origin}/v1/models \\\n  -H "Authorization: Bearer ${created.key.slice(0, 11)}…"`}
      </pre>
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
