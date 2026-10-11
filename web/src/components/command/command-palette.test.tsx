import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChatSummary } from '@/types/chat'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createChat: vi.fn(),
  setTheme: vi.fn(),
  queries: [] as Array<{ q?: string }>,
}))

function summary(id: string, title: string): ChatSummary {
  const now = new Date().toISOString()
  return {
    id,
    title,
    model: 'llama3.1',
    pinned: false,
    archived: false,
    folderId: null,
    shareId: null,
    updatedAt: now,
    createdAt: now,
    messageCount: 2,
  }
}

const ALL = [summary('c1', 'Release notes'), summary('c2', 'pgvector plan'), summary('c3', 'Docker')]

vi.mock('@/hooks/use-chats', () => ({
  // Stands in for the server-side search, which also matches message bodies.
  useChats: (params: { q?: string } = {}) => {
    mocks.queries.push(params)
    const q = params.q?.toLowerCase()
    if (!q) return { data: ALL, isFetching: false }
    const byTitle = ALL.filter((c) => c.title.toLowerCase().includes(q))
    // "Welcome" mentions the theme only in its messages, as the real seed does.
    const byBody = q === 'light' ? [summary('c9', 'Welcome to LLM Dev Kit')] : []
    return { data: [...byBody, ...byTitle], isFetching: false }
  },
  useCreateChat: () => ({ mutate: mocks.createChat, isPending: false }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('next-themes', () => ({ useTheme: () => ({ setTheme: mocks.setTheme }) }))

import { CommandPalette } from '@/components/command/command-palette'
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts'
import { useUiStore } from '@/stores/ui-store'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.queries.length = 0
  useUiStore.setState({ paletteOpen: false, newFolderOpen: false, sidebarCollapsed: false })
})

afterEach(() => {
  vi.useRealTimers()
})

function openPalette() {
  act(() => useUiStore.setState({ paletteOpen: true }))
  return screen.getByRole('combobox')
}

const activeOption = (input: HTMLElement) =>
  document.getElementById(input.getAttribute('aria-activedescendant') ?? '')

describe('CommandPalette', () => {
  it('opens on actions, then recent chats, with the first item active', () => {
    render(<CommandPalette />)
    const input = openPalette()

    const options = screen.getAllByRole('option').map((o) => o.textContent)
    expect(options[0]).toContain('New chat')
    expect(options.slice(-3).map((o) => o?.replace(/now$/, ''))).toEqual([
      'Release notes',
      'pgvector plan',
      'Docker',
    ])
    expect(activeOption(input)?.textContent).toContain('New chat')
    expect(document.activeElement).toBe(input)
  })

  it('moves with the arrow keys, wraps, and runs the active action on Enter', () => {
    render(<CommandPalette />)
    const input = openPalette()

    fireEvent.keyDown(input, { key: 'ArrowUp' }) // wraps to the last item
    expect(activeOption(input)?.textContent).toContain('Docker')
    fireEvent.keyDown(input, { key: 'Home' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(activeOption(input)?.textContent).toContain('New folder')

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useUiStore.getState().newFolderOpen).toBe(true)
    expect(useUiStore.getState().paletteOpen).toBe(false)
  })

  it('searches chats on the server and opens the chosen one', async () => {
    render(<CommandPalette />)
    const input = openPalette()

    fireEvent.change(input, { target: { value: 'pg' } })
    await waitFor(() => expect(mocks.queries.at(-1)).toEqual({ q: 'pg' }))
    // Matching chats come first while searching.
    await waitFor(() => expect(activeOption(input)?.textContent).toContain('pgvector plan'))

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mocks.push).toHaveBeenCalledWith('/c/c2')
    expect(useUiStore.getState().paletteOpen).toBe(false)
  })

  it('filters actions by keyword and says when nothing matches', async () => {
    render(<CommandPalette />)
    const input = openPalette()

    fireEvent.change(input, { target: { value: 'appearance' } })
    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Dark theme',
        'Light theme',
        'System theme',
      ]),
    )

    fireEvent.change(input, { target: { value: 'zzz' } })
    await waitFor(() => expect(screen.getByText(/No chats or commands match/)).toBeTruthy())
  })

  it('ranks an action named like the query above a chat that only mentions it', async () => {
    render(<CommandPalette />)
    const input = openPalette()

    fireEvent.change(input, { target: { value: 'light' } })
    await waitFor(() => expect(screen.getByText('Welcome to LLM Dev Kit')).toBeTruthy())
    expect(screen.getAllByRole('option').map((o) => o.textContent?.replace(/now$/, ''))).toEqual([
      'Light theme',
      'Welcome to LLM Dev Kit',
    ])

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mocks.setTheme).toHaveBeenCalledWith('light')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('never shows the previous results as matches while a search is pending', () => {
    render(<CommandPalette />)
    const input = openPalette()

    // Immediately after typing, the server search has not caught up yet.
    fireEvent.change(input, { target: { value: 'pg' } })
    expect(screen.queryAllByRole('option')).toEqual([])
    expect(screen.getByText('Searching chats…')).toBeTruthy()
  })

  it('starts a new chat from the palette', () => {
    render(<CommandPalette />)
    const input = openPalette()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mocks.createChat).toHaveBeenCalledWith({})
  })
})

function ShortcutHost() {
  useGlobalShortcuts()
  return null
}

describe('global shortcuts', () => {
  it('toggles the palette, starts a chat and collapses the sidebar', () => {
    render(<ShortcutHost />)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(useUiStore.getState().paletteOpen).toBe(true)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(useUiStore.getState().paletteOpen).toBe(false)

    fireEvent.keyDown(window, { key: 'O', metaKey: true, shiftKey: true })
    expect(mocks.createChat).toHaveBeenCalledWith({})

    fireEvent.keyDown(window, { key: 'b', metaKey: true })
    expect(useUiStore.getState().sidebarCollapsed).toBe(true)

    // Plain keys and other modifiers are left alone.
    fireEvent.keyDown(window, { key: 'k' })
    fireEvent.keyDown(window, { key: 'k', metaKey: true, altKey: true })
    expect(useUiStore.getState().paletteOpen).toBe(false)
  })
})
