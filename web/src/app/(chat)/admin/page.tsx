import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AdminView } from '@/components/admin/admin-view'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { ROUTES } from '@/lib/constants'
import { roleOf } from '@/server/http'

export const metadata: Metadata = { title: 'Admin' }
export const dynamic = 'force-dynamic'

/**
 * The page holds no data itself: everything on it comes from /api/admin,
 * which answers non-admins with 403. Non-admins get an explanation here
 * instead of the panels.
 */
export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect(ROUTES.login)

  if ((await roleOf(session.user.id)) !== 'admin') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
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

  return <AdminView currentUserId={session.user.id} />
}
