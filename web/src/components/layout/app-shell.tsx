'use client'

import * as React from 'react'

import { AuroraBackdrop } from '@/components/brand/aurora-backdrop'
import { CommandPalette } from '@/components/command/command-palette'
import { NewFolderDialog } from '@/components/sidebar/new-folder-dialog'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'

interface AppShellProps {
  user: { name: string | null; email: string | null; image: string | null }
  children: React.ReactNode
}

/**
 * Two presentations of one sidebar: a floating glass panel from `lg` up that
 * collapses to an icon rail, and an overlay drawer below it. The drawer closes
 * on navigation, which is the whole reason `onNavigate` is threaded down.
 * The command palette, new-folder dialog and keyboard shortcuts live here so
 * they exist once, whichever surface opens them.
 */
export function AppShell({ user, children }: AppShellProps) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen)
  const newFolderOpen = useUiStore((state) => state.newFolderOpen)
  const setNewFolderOpen = useUiStore((state) => state.setNewFolderOpen)

  useGlobalShortcuts()

  return (
    <div className="relative isolate flex h-dvh w-full overflow-hidden bg-background">
      <AuroraBackdrop />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to conversation
      </a>

      <aside
        id="sidebar"
        aria-label="Sidebar"
        className={cn(
          'relative hidden shrink-0 p-2 transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] lg:block',
          sidebarCollapsed ? 'w-[4.75rem]' : 'w-[19rem]',
        )}
      >
        <div className="glass h-full overflow-hidden rounded-2xl border shadow-[0_20px_60px_-30px_hsl(var(--aurora-1)/0.45)]">
          <Sidebar user={user} collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
        </div>
      </aside>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="glass w-80 border-r p-0 lg:hidden">
          {/* Radix requires an accessible title on every dialog surface. */}
          <SheetTitle className="sr-only">Chats</SheetTitle>
          <Sidebar user={user} onNavigate={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main id="main-content" className="relative flex min-w-0 flex-1 flex-col">
        {children}
      </main>

      <CommandPalette />
      <NewFolderDialog open={newFolderOpen} onOpenChange={setNewFolderOpen} />
    </div>
  )
}
