'use client'

import { FolderPlus, PanelLeftClose, PanelLeftOpen, PenSquare, Search } from 'lucide-react'
import { useParams } from 'next/navigation'
import * as React from 'react'

import { BrandMark } from '@/components/brand/brand-mark'
import { ChatListItem } from '@/components/sidebar/chat-list-item'
import { FolderSection } from '@/components/sidebar/folder-section'
import { UserMenu } from '@/components/sidebar/user-menu'
import { ChatListSkeleton, FolderListSkeleton } from '@/components/skeletons/sidebar-skeleton'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useChats, useCreateChat } from '@/hooks/use-chats'
import { useFolders } from '@/hooks/use-folders'
import { groupChatsByDate } from '@/lib/date-groups'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'
import type { ChatSummary } from '@/types/chat'

interface SidebarProps {
  user: { name: string | null; email: string | null; image: string | null }
  /** Desktop only: render the icon rail instead of the full panel. */
  collapsed?: boolean
  /** Desktop only: show the collapse/expand control. */
  onToggleCollapsed?: () => void
  /** Closes the mobile drawer after navigating. */
  onNavigate?: () => void
}

export function Sidebar({ user, collapsed = false, onToggleCollapsed, onNavigate }: SidebarProps) {
  const createChat = useCreateChat()
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen)
  const setNewFolderOpen = useUiStore((state) => state.setNewFolderOpen)

  if (collapsed) {
    return (
      <Rail
        user={user}
        onNewChat={() => createChat.mutate({})}
        newChatPending={createChat.isPending}
        onSearch={() => setPaletteOpen(true)}
        onNewFolder={() => setNewFolderOpen(true)}
        {...(onToggleCollapsed ? { onExpand: onToggleCollapsed } : {})}
      />
    )
  }

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-4 pb-2 pt-4">
        <BrandMark size="sm" />
        <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold tracking-tight">
          LLM Dev Kit
        </span>
        {onToggleCollapsed && (
          <IconTip label="Collapse sidebar" shortcut="⌘B">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapsed}
              aria-expanded="true"
              aria-controls="sidebar"
              className="text-muted-foreground hover:bg-foreground/5"
            >
              <PanelLeftClose />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          </IconTip>
        )}
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => createChat.mutate({})}
          disabled={createChat.isPending}
          className={cn(
            'flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-medium shadow-sm transition-colors',
            'hover:bg-primary/90 disabled:opacity-60',
          )}
        >
          <PenSquare className="size-4" />
          New chat
          <span className="ml-auto flex gap-0.5 opacity-80 [@media(pointer:coarse)]:hidden">
            <Kbd className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">⇧</Kbd>
            <Kbd className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">⌘</Kbd>
            <Kbd className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">O</Kbd>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="size-3.5" />
          Search chats
          <span className="ml-auto flex gap-0.5 [@media(pointer:coarse)]:hidden">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <ChatNavigation onNewFolder={() => setNewFolderOpen(true)} {...(onNavigate ? { onNavigate } : {})} />

      <div className="p-2">
        <UserMenu user={user} />
      </div>
    </div>
  )
}

function ChatNavigation({
  onNewFolder,
  onNavigate,
}: {
  onNewFolder: () => void
  onNavigate?: () => void
}) {
  const params = useParams<{ chatId?: string }>()
  const activeChatId = params?.chatId ?? null

  const { data: chats, isLoading: chatsLoading } = useChats()
  const { data: folders, isLoading: foldersLoading } = useFolders()
  const expandedFolderIds = useUiStore((state) => state.expandedFolderIds)
  const toggleFolder = useUiStore((state) => state.toggleFolder)

  const { grouped, dated } = React.useMemo(() => {
    const byFolder = new Map<string, ChatSummary[]>()
    const loose: ChatSummary[] = []
    for (const chat of chats ?? []) {
      if (chat.folderId) {
        byFolder.set(chat.folderId, [...(byFolder.get(chat.folderId) ?? []), chat])
      } else {
        loose.push(chat)
      }
    }
    return { grouped: byFolder, dated: groupChatsByDate(loose) }
  }, [chats])

  const navigate = onNavigate ? { onNavigate } : {}

  return (
    <nav className="scrollbar-thin flex-1 overflow-y-auto pb-3" aria-label="Chat history">
      {chatsLoading || foldersLoading ? (
        <div className="space-y-4">
          <FolderListSkeleton />
          <ChatListSkeleton />
        </div>
      ) : (
        <>
          <section className="mb-2" aria-labelledby="folders-heading">
            <div className="flex items-center justify-between px-4 pb-1 pt-2">
              <GroupHeading id="folders-heading">Folders</GroupHeading>
              <IconTip label="New folder">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onNewFolder}
                  className="size-6 text-muted-foreground hover:bg-foreground/5"
                >
                  <FolderPlus className="size-3.5" />
                  <span className="sr-only">New folder</span>
                </Button>
              </IconTip>
            </div>
            {(folders?.length ?? 0) === 0 ? (
              <p className="px-4 pb-1 text-xs text-muted-foreground/80">
                Group related chats into folders.
              </p>
            ) : (
              <div className="space-y-0.5">
                {folders?.map((folder) => (
                  <FolderSection
                    key={folder.id}
                    folder={folder}
                    chats={grouped.get(folder.id) ?? []}
                    allFolders={folders}
                    activeChatId={activeChatId}
                    isExpanded={expandedFolderIds.includes(folder.id)}
                    onToggle={() => toggleFolder(folder.id)}
                    {...navigate}
                  />
                ))}
              </div>
            )}
          </section>

          {dated.length === 0 && (chats?.length ?? 0) === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No chats yet. Start one to see it here.
            </p>
          ) : (
            dated.map((group) => (
              <section key={group.id} className="mb-2" aria-labelledby={`group-${group.id}`}>
                <div className="px-4 pb-1 pt-2">
                  <GroupHeading id={`group-${group.id}`}>{group.label}</GroupHeading>
                </div>
                <ul className="space-y-0.5">
                  {group.chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChatId}
                      folders={folders ?? []}
                      {...navigate}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </nav>
  )
}

function GroupHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
      {children}
    </h2>
  )
}

function IconTip({
  label,
  shortcut,
  side = 'bottom',
  children,
}: {
  label: string
  shortcut?: string
  side?: 'bottom' | 'right'
  children: React.ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="flex items-center gap-2">
        {label}
        {shortcut && <span className="text-muted-foreground">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

/** The collapsed sidebar: the same actions as icons, labelled by tooltips. */
function Rail({
  user,
  onNewChat,
  newChatPending,
  onSearch,
  onNewFolder,
  onExpand,
}: {
  user: SidebarProps['user']
  onNewChat: () => void
  newChatPending: boolean
  onSearch: () => void
  onNewFolder: () => void
  onExpand?: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center gap-2 py-4">
      <BrandMark size="md" className="mb-2" />

      {onExpand && (
        <IconTip label="Expand sidebar" shortcut="⌘B" side="right">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            aria-expanded="false"
            aria-controls="sidebar"
            className="text-muted-foreground hover:bg-foreground/5"
          >
            <PanelLeftOpen />
            <span className="sr-only">Expand sidebar</span>
          </Button>
        </IconTip>
      )}

      <IconTip label="New chat" shortcut="⇧⌘O" side="right">
        <button
          type="button"
          onClick={onNewChat}
          disabled={newChatPending}
          className="flex size-9 items-center justify-center rounded-lg bg-brand shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <PenSquare className="size-4" />
          <span className="sr-only">New chat</span>
        </button>
      </IconTip>

      <IconTip label="Search chats" shortcut="⌘K" side="right">
        <Button variant="ghost" size="icon" onClick={onSearch} className="text-muted-foreground hover:bg-foreground/5">
          <Search />
          <span className="sr-only">Search chats</span>
        </Button>
      </IconTip>

      <IconTip label="New folder" side="right">
        <Button variant="ghost" size="icon" onClick={onNewFolder} className="text-muted-foreground hover:bg-foreground/5">
          <FolderPlus />
          <span className="sr-only">New folder</span>
        </Button>
      </IconTip>

      <div className="mt-auto">
        <UserMenu user={user} compact />
      </div>
    </div>
  )
}
