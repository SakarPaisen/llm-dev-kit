'use client'

import { format } from 'date-fns'
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
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminUsers, useSetRole } from '@/hooks/use-admin'
import { ROLES, type Role, SCOPES_BY_ROLE } from '@/lib/roles'
import type { AdminUser } from '@/types/admin'

const ROLE_HELP: Record<Role, string> = {
  viewer: 'Chat',
  user: 'Chat and add documents',
  admin: 'Everything, including this page',
}

const SIGN_IN_LABEL: Record<string, string> = {
  password: 'Password',
  github: 'GitHub',
  keycloak: 'SSO',
}

export function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const users = useAdminUsers()
  const setRole = useSetRole()
  const [demotingSelf, setDemotingSelf] = React.useState<Role | null>(null)

  const change = (user: AdminUser, role: Role) => {
    if (role === user.role) return
    if (user.id === currentUserId && role !== 'admin') {
      setDemotingSelf(role)
      return
    }
    setRole.mutate({ userId: user.id, role })
  }

  return (
    <section aria-labelledby="users-heading" className="space-y-4">
      <div>
        <h2 id="users-heading" className="text-base font-semibold">
          Users
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A role decides what someone can do in the chat and with their API keys.{' '}
          {ROLES.map((role) => `${role}: ${ROLE_HELP[role].toLowerCase()}`).join(' · ')}. Changes
          apply to API keys at once and to open sessions within five minutes.
        </p>
      </div>

      {users.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : users.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load users: {users.error.message}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">User</th>
                <th scope="col" className="px-3 py-2 font-medium">Signs in with</th>
                <th scope="col" className="px-3 py-2 font-medium">Role</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Chats</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">API keys</th>
                <th scope="col" className="px-3 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.data?.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">
                      {user.name ?? user.email}
                      {user.id === currentUserId && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                      )}
                    </p>
                    {user.name && <p className="text-xs text-muted-foreground">{user.email}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {user.signIn.map((method) => (
                        <Badge key={method} variant="secondary" className="font-normal">
                          {SIGN_IN_LABEL[method] ?? method}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Select
                      value={user.role}
                      onValueChange={(value) => change(user, value as Role)}
                      disabled={setRole.isPending}
                    >
                      <SelectTrigger
                        className="h-8 w-28"
                        aria-label={`Role of ${user.name ?? user.email}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{user.chatCount}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{user.apiKeyCount}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {format(new Date(user.createdAt), 'd MMM yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={demotingSelf !== null} onOpenChange={(open) => !open && setDemotingSelf(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Give up your admin role?</AlertDialogTitle>
            <AlertDialogDescription>
              You will become a {demotingSelf} ({SCOPES_BY_ROLE[demotingSelf ?? 'viewer'].join(', ')})
              and lose access to this page. Another admin would have to give it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                demotingSelf &&
                setRole.mutate(
                  { userId: currentUserId, role: demotingSelf },
                  { onSuccess: () => window.location.assign('/') },
                )
              }
            >
              Become {demotingSelf}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
