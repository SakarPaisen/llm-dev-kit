'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  /** Desktop rail collapsed state. Persisted — it is a deliberate preference. */
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  /** Mobile drawer. Never persisted: it should always open closed. */
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void

  expandedFolderIds: string[]
  toggleFolder: (folderId: string) => void

  /** Command palette (⌘K). Never persisted. */
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void

  /** New-folder dialog, opened from the sidebar or the palette. Never persisted. */
  newFolderOpen: boolean
  setNewFolderOpen: (open: boolean) => void

  /** API keys dialog, opened from the account menu. Never persisted. */
  apiKeysOpen: boolean
  setApiKeysOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      mobileSidebarOpen: false,
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      expandedFolderIds: [],
      toggleFolder: (folderId) => {
        const current = get().expandedFolderIds
        set({
          expandedFolderIds: current.includes(folderId)
            ? current.filter((id) => id !== folderId)
            : [...current, folderId],
        })
      },

      paletteOpen: false,
      setPaletteOpen: (open) => set({ paletteOpen: open }),

      newFolderOpen: false,
      setNewFolderOpen: (open) => set({ newFolderOpen: open }),

      apiKeysOpen: false,
      setApiKeysOpen: (open) => set({ apiKeysOpen: open }),
    }),
    {
      name: 'llm-dev-kit.ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        expandedFolderIds: state.expandedFolderIds,
      }),
    },
  ),
)
