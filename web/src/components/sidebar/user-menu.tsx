'use client'

import { ChevronsUpDown, KeyRound, LogOut, Monitor, Moon, ShieldCheck, Sun } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/lib/constants'
import { originOf, switchTheme, type ThemeChoice } from '@/lib/theme-transition'
import { cn, initialsOf } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'
import type { ShellUser } from '@/types/user'

interface UserMenuProps {
  user: ShellUser
  /** Avatar only, for the collapsed rail. */
  compact?: boolean
}

export function UserMenu({ user, compact = false }: UserMenuProps) {
  const { theme, setTheme } = useTheme()
  const setApiKeysOpen = useUiStore((state) => state.setApiKeysOpen)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // `theme` is undefined until the client mounts; rendering it during hydration
  // would mismatch the server output.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const avatar = (
    <Avatar className="size-7 border">
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback className="text-[10px] font-semibold">
        {initialsOf(user.name ?? user.email)}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            'flex items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-sidebar-accent',
            compact ? 'p-1' : 'w-full border bg-foreground/[0.02] px-2.5 py-2 glass-border',
          )}
        >
          {avatar}
          {compact ? (
            <span className="sr-only">Account menu for {user.name ?? user.email}</span>
          ) : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{user.name ?? 'Account'}</span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side={compact ? 'right' : 'top'} className="w-60">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={mounted ? (theme ?? 'system') : 'system'}
          onValueChange={(value) =>
            switchTheme(value as ThemeChoice, setTheme, originOf(triggerRef.current))
          }
        >
          <DropdownMenuRadioItem value="light">
            <Sun />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => setApiKeysOpen(true)}>
          <KeyRound />
          API keys
        </DropdownMenuItem>
        {user.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href={ROUTES.admin}>
              <ShieldCheck />
              Admin
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={() => void signOut({ callbackUrl: ROUTES.login })}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
