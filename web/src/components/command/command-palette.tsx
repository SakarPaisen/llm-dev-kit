'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  CornerDownLeft,
  FolderPlus,
  Loader2,
  MessageSquare,
  Monitor,
  Moon,
  PanelLeft,
  PenSquare,
  Pin,
  Search,
  Sun,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import * as React from 'react'

import { Kbd } from '@/components/ui/kbd'
import { useChats, useCreateChat } from '@/hooks/use-chats'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { ROUTES } from '@/lib/constants'
import { shortAge } from '@/lib/date-groups'
import { switchTheme, type ThemeChoice } from '@/lib/theme-transition'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'

interface PaletteItem {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  group: 'Chats' | 'Actions'
  keywords?: string
  run: () => void
}

/**
 * Rank while searching: an action named like the query beats a chat titled
 * like it, which beats a chat that only matched in its messages (the server
 * search covers bodies), which beats an action matched only by keyword.
 * Typing "light" should switch the theme, not open a chat that mentions light.
 */
function rank(item: PaletteItem, needle: string): number {
  const inLabel = item.label.toLowerCase().includes(needle)
  if (item.group === 'Actions') return inLabel ? 0 : 3
  return inLabel ? 1 : 2
}

interface Section {
  group: PaletteItem['group']
  entries: PaletteItem[]
}

/** Group items into sections in order of first appearance, keeping their order. */
function sectionsOf(items: PaletteItem[]): Section[] {
  const sections: Section[] = []
  for (const item of items) {
    const section = sections.find((candidate) => candidate.group === item.group)
    if (section) section.entries.push(item)
    else sections.push({ group: item.group, entries: [item] })
  }
  return sections
}

const RECENT_LIMIT = 8
const SEARCH_LIMIT = 20

/**
 * ⌘K: search every chat (server-side, message bodies included) and run app
 * actions without the mouse.
 *
 * Implements the ARIA combobox pattern: focus stays in the input, arrow keys
 * move `aria-activedescendant` through the listbox, Enter runs the active item.
 */
export function CommandPalette() {
  const open = useUiStore((state) => state.paletteOpen)
  const setOpen = useUiStore((state) => state.setPaletteOpen)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed left-1/2 top-[14vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border bg-popover shadow-xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2',
          )}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          {/* Mounted only while open, so its query state resets every time. */}
          {open && <PaletteBody close={() => setOpen(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function PaletteBody({ close }: { close: () => void }) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const createChat = useCreateChat()
  const setNewFolderOpen = useUiStore((state) => state.setNewFolderOpen)
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  const [query, setQuery] = React.useState('')
  const debounced = useDebouncedValue(query.trim(), 150)
  const { data: chats, isFetching } = useChats(debounced ? { q: debounced } : {})
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)

  const theme = (choice: ThemeChoice) => () => switchTheme(choice, setTheme)

  const actions: PaletteItem[] = [
    {
      id: 'new-chat',
      label: 'New chat',
      hint: '⇧⌘O',
      icon: PenSquare,
      group: 'Actions',
      keywords: 'start create conversation',
      run: () => createChat.mutate({}),
    },
    {
      id: 'new-folder',
      label: 'New folder',
      icon: FolderPlus,
      group: 'Actions',
      keywords: 'create organise',
      run: () => setNewFolderOpen(true),
    },
    {
      id: 'toggle-sidebar',
      label: sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
      hint: '⌘B',
      icon: PanelLeft,
      group: 'Actions',
      keywords: 'rail panel hide show',
      run: toggleSidebar,
    },
    { id: 'theme-dark', label: 'Dark theme', icon: Moon, group: 'Actions', keywords: 'appearance night', run: theme('dark') },
    { id: 'theme-light', label: 'Light theme', icon: Sun, group: 'Actions', keywords: 'appearance day', run: theme('light') },
    { id: 'theme-system', label: 'System theme', icon: Monitor, group: 'Actions', keywords: 'appearance auto', run: theme('system') },
  ]

  const needle = query.trim().toLowerCase()
  const matchingActions = needle
    ? actions.filter((a) => `${a.label} ${a.keywords ?? ''}`.toLowerCase().includes(needle))
    : actions

  // The chat list belongs to the debounced query. Until it catches up with
  // what is in the box, showing it would present stale rows as matches.
  const searchSettled = debounced.toLowerCase() === needle
  const chatItems: PaletteItem[] = (searchSettled ? (chats ?? []) : [])
    .slice(0, needle ? SEARCH_LIMIT : RECENT_LIMIT)
    .map((chat) => ({
      id: `chat-${chat.id}`,
      label: chat.title,
      hint: shortAge(chat.updatedAt),
      icon: chat.pinned ? Pin : MessageSquare,
      group: 'Chats' as const,
      run: () => router.push(ROUTES.chat(chat.id)),
    }))

  // Idle: actions, then recent chats. Searching: by rank, ties keep their order.
  const ranked = needle
    ? [...matchingActions, ...chatItems]
        .map((item, index) => ({ item, index, score: rank(item, needle) }))
        .sort((a, b) => a.score - b.score || a.index - b.index)
        .map(({ item }) => item)
    : [...matchingActions, ...chatItems]
  // Keyboard order must match what is on screen, so flatten the sections.
  const sections = sectionsOf(ranked)
  const items = sections.flatMap((section) => section.entries)
  const activeIndex = Math.min(active, Math.max(items.length - 1, 0))
  const activeItem = items[activeIndex]

  React.useEffect(() => setActive(0), [needle])

  React.useEffect(() => {
    if (!activeItem) return
    // Optional call: jsdom (tests) has no scrollIntoView.
    listRef.current?.ownerDocument
      .getElementById(`cmd-${activeItem.id}`)
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [activeItem])

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return
    close()
    item.run()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((activeIndex + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((activeIndex - 1 + items.length) % items.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActive(items.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runItem(activeItem)
    }
  }


  return (
    <div className="flex max-h-[min(70vh,34rem)] flex-col">
      <div className="flex items-center gap-3 border-b px-4 glass-border">
        {(isFetching && debounced) || !searchSettled ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Search className="size-4 shrink-0 text-muted-foreground" />
        )}
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search chats or run a command…"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-list"
          aria-autocomplete="list"
          aria-activedescendant={activeItem ? `cmd-${activeItem.id}` : undefined}
          aria-label="Search chats or run a command"
          className="h-14 min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Kbd>esc</Kbd>
      </div>

      <div
        ref={listRef}
        id="command-list"
        role="listbox"
        aria-label="Results"
        className="scrollbar-thin flex-1 overflow-y-auto p-2"
      >
        {items.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            {isFetching || !searchSettled
              ? 'Searching chats…'
              : `No chats or commands match “${query.trim()}”.`}
          </p>
        ) : (
          sections.map(({ group, entries }) => (
            <div key={group} role="group" aria-label={group} className="mb-1 last:mb-0">
              <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {group === 'Chats' && !needle ? 'Recent chats' : group}
              </div>
              {entries.map((item) => {
                const isActive = item === activeItem
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    id={`cmd-${item.id}`}
                    role="option"
                    aria-selected={isActive}
                    onMouseMove={() => setActive(items.indexOf(item))}
                    onClick={() => runItem(item)}
                    className={cn(
                      'relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive ? 'bg-accent text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {isActive && (
                      <span className="absolute inset-y-2 left-0 w-[3px] animate-accent-in rounded-full bg-primary" />
                    )}
                    <Icon className={cn('size-4 shrink-0', isActive && 'text-primary')} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.hint && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground/80">
                        {item.hint}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground glass-border">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd>
            <CornerDownLeft className="size-3" />
          </Kbd>
          open
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd> toggle
        </span>
      </div>
    </div>
  )
}
