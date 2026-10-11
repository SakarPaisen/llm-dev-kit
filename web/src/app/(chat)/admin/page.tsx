import type { Metadata } from 'next'
import { forbidden, redirect } from 'next/navigation'

import { AdminView } from '@/components/admin/admin-view'
import { auth } from '@/lib/auth'
import { ROUTES } from '@/lib/constants'
import { roleOf } from '@/server/http'

export const metadata: Metadata = { title: 'Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect(ROUTES.login)
  // A real 403, checked here and again by every /api/admin route.
  if ((await roleOf(session.user.id)) !== 'admin') forbidden()

  return <AdminView currentUserId={session.user.id} />
}
