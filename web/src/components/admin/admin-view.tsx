'use client'

import { Activity, Menu, Users } from 'lucide-react'
import * as React from 'react'

import { HealthPanel } from '@/components/admin/health-panel'
import { UsersPanel } from '@/components/admin/users-panel'
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'health', label: 'Health', icon: Activity },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminView({ currentUserId }: { currentUserId: string }) {
  const [tab, setTab] = React.useState<TabId>('users')

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
        <span className="lg:hidden">
          <MobileSidebarTrigger>
            <Menu />
            <span className="sr-only">Open chat list</span>
          </MobileSidebarTrigger>
        </span>
        <h1 className="text-sm font-semibold">Admin</h1>

        <div role="tablist" aria-label="Admin sections" className="ml-4 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`admin-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`admin-panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                tab === id
                  ? 'bg-accent font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <div
        role="tabpanel"
        id={`admin-panel-${tab}`}
        aria-labelledby={`admin-tab-${tab}`}
        className="scrollbar-thin flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {tab === 'users' ? <UsersPanel currentUserId={currentUserId} /> : <HealthPanel />}
        </div>
      </div>
    </div>
  )
}
