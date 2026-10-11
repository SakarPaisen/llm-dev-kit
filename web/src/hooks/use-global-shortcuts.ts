'use client'

import { useEffect } from 'react'

import { useCreateChat } from '@/hooks/use-chats'
import { useUiStore } from '@/stores/ui-store'

/**
 * App-wide keyboard shortcuts, registered once by the app shell:
 *
 * - ⌘K / Ctrl+K: toggle the command palette
 * - ⇧⌘O / Ctrl+Shift+O: new chat
 * - ⌘B / Ctrl+B: collapse or expand the sidebar
 */
export function useGlobalShortcuts() {
  const createChat = useCreateChat()
  const { mutate: create } = createChat

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      const key = event.key.toLowerCase()
      const store = useUiStore.getState()

      if (key === 'k' && !event.shiftKey) {
        event.preventDefault()
        store.setPaletteOpen(!store.paletteOpen)
      } else if (key === 'o' && event.shiftKey) {
        event.preventDefault()
        store.setPaletteOpen(false)
        create({})
      } else if (key === 'b' && !event.shiftKey) {
        event.preventDefault()
        store.toggleSidebar()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [create])
}
