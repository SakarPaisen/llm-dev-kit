import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export default function Forbidden() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">403</p>
      <h1 className="text-lg font-semibold">You do not have access to this page</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It needs the admin role. Ask an admin of this instance if you need it.
      </p>
      <Button asChild>
        <Link href={ROUTES.home}>Back to chats</Link>
      </Button>
    </div>
  )
}
