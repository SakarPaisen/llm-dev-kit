'use client'

import * as React from 'react'

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
 * Two presentations of one sidebar: a docked panel from `lg` up that
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
          'relative hidden shrink-0 border-r bg-sidebar transition-[width] duration-300 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] lg:block',
          sidebarCollapsed ? 'w-[4.25rem]' : 'w-[18rem]',
        )}
      >
        <Sidebar user={user} collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
      </aside>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 border-r bg-sidebar p-0 lg:hidden">
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
