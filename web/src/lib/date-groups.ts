import type { ChatSummary } from '@/types/chat'

export type ChatGroupId = 'pinned' | 'today' | 'yesterday' | 'week' | 'month' | 'older'

export interface ChatGroup {
  id: ChatGroupId
  label: string
  chats: ChatSummary[]
}

const LABELS: Record<ChatGroupId, string> = {
  pinned: 'Pinned',
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Previous 7 days',
  month: 'Previous 30 days',
  older: 'Older',
}

const ORDER: ChatGroupId[] = ['pinned', 'today', 'yesterday', 'week', 'month', 'older']
const DAY_MS = 86_400_000

/** Midnight at the start of `date`'s day, in local time. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function groupOf(chat: ChatSummary, todayStart: number): ChatGroupId {
  if (chat.pinned) return 'pinned'
  const updated = new Date(chat.updatedAt).getTime()
  if (updated >= todayStart) return 'today'
  if (updated >= todayStart - DAY_MS) return 'yesterday'
  if (updated >= todayStart - 7 * DAY_MS) return 'week'
  if (updated >= todayStart - 30 * DAY_MS) return 'month'
  return 'older'
}

/**
 * Bucket chats for the sidebar: pinned first, then by how recently they were
 * active, in local calendar days. Order within a group is preserved (the API
 * already sorts by recency). Empty groups are left out.
 */
export function groupChatsByDate(chats: ChatSummary[], now: Date = new Date()): ChatGroup[] {
  const todayStart = startOfDay(now)
  const buckets = new Map<ChatGroupId, ChatSummary[]>()

  for (const chat of chats) {
    const id = groupOf(chat, todayStart)
    const bucket = buckets.get(id)
    if (bucket) bucket.push(chat)
    else buckets.set(id, [chat])
  }

  return ORDER.flatMap((id) => {
    const bucket = buckets.get(id)
    return bucket ? [{ id, label: LABELS[id], chats: bucket }] : []
  })
}

/** Compact age for list rows: "now", "5m", "3h", "2d", "4w", then "Mar 4". */
export function shortAge(iso: string, now: Date = new Date()): string {
  const then = new Date(iso)
  const seconds = Math.max(0, (now.getTime() - then.getTime()) / 1000)
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < DAY_MS / 1000) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 7 * (DAY_MS / 1000)) return `${Math.floor(seconds / (DAY_MS / 1000))}d`
  if (seconds < 30 * (DAY_MS / 1000)) return `${Math.floor(seconds / (7 * (DAY_MS / 1000)))}w`
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
