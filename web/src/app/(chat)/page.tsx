import { Menu } from 'lucide-react'

import { NewChatLauncher } from '@/components/chat/new-chat-launcher'
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger'

export const dynamic = 'force-dynamic'

export default function ChatHomePage() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-background/40 px-3 backdrop-blur-xl lg:hidden">
        <MobileSidebarTrigger>
          <Menu />
          <span className="sr-only">Open chat list</span>
        </MobileSidebarTrigger>
        <span className="text-sm font-semibold tracking-tight">
          LLM <span className="text-aurora">Dev Kit</span>
        </span>
      </header>

      <NewChatLauncher />
    </div>
  )
}
