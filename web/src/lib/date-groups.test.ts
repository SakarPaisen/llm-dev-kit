import { describe, expect, it } from 'vitest'

import { groupChatsByDate, shortAge } from '@/lib/date-groups'
import type { ChatSummary } from '@/types/chat'

// Fixed "now": Thursday 9 October 2026, 15:00 local time.
const NOW = new Date(2026, 9, 9, 15, 0, 0)

function chat(id: string, updatedAt: Date, pinned = false): ChatSummary {
  return {
    id,
    title: id,
    model: 'llama3.1',
    pinned,
    archived: false,
    folderId: null,
    shareId: null,
    updatedAt: updatedAt.toISOString(),
    createdAt: updatedAt.toISOString(),
    messageCount: 1,
  }
}

const at = (days: number, hours = 12) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - days, hours)

describe('groupChatsByDate', () => {
  it('buckets by local calendar day and keeps the given order', () => {
    const chats = [
      chat('pinned-old', at(90), true),
      chat('this-morning', at(0, 8)),
      chat('just-after-midnight', at(0, 0)),
      chat('last-night', at(1, 23)),
      chat('three-days', at(3)),
      chat('two-weeks', at(14)),
      chat('ancient', at(400)),
    ]

    const groups = groupChatsByDate(chats, NOW)
    expect(groups.map((g) => [g.label, g.chats.map((c) => c.id)])).toEqual([
      ['Pinned', ['pinned-old']],
      ['Today', ['this-morning', 'just-after-midnight']],
      ['Yesterday', ['last-night']],
      ['Previous 7 days', ['three-days']],
      ['Previous 30 days', ['two-weeks']],
      ['Older', ['ancient']],
    ])
  })

  it('leaves out empty groups', () => {
    expect(groupChatsByDate([chat('a', at(0))], NOW).map((g) => g.id)).toEqual(['today'])
    expect(groupChatsByDate([], NOW)).toEqual([])
  })
})

describe('shortAge', () => {
  it.each([
    [new Date(NOW.getTime() - 20_000), 'now'],
    [new Date(NOW.getTime() - 5 * 60_000), '5m'],
    [new Date(NOW.getTime() - 3 * 3_600_000), '3h'],
    [new Date(NOW.getTime() - 2 * 86_400_000), '2d'],
    [new Date(NOW.getTime() - 15 * 86_400_000), '2w'],
  ])('%s -> %s', (when, expected) => {
    expect(shortAge(when.toISOString(), NOW)).toBe(expected)
  })

  it('falls back to a short date after a month', () => {
    const label = shortAge(new Date(2026, 2, 4).toISOString(), NOW)
    expect(label).toMatch(/4/)
    expect(label).not.toMatch(/\d+[mhdw]$/)
  })
})
