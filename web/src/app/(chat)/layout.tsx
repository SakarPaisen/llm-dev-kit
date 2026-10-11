import { redirect } from 'next/navigation'

import { AppShell } from '@/components/layout/app-shell'
import { auth } from '@/lib/auth'
import { ROUTES } from '@/lib/constants'
import { roleOf } from '@/server/http'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Middleware already gates these routes; this second check is what lets the
  // rest of the tree treat `user` as non-null without assertions.
  if (!session?.user?.id) {
    redirect(ROUTES.login)
  }

  // From the database, so a promotion shows the Admin entry on the next page load.
  const isAdmin = (await roleOf(session.user.id)) === 'admin'

  return (
    <AppShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        isAdmin,
      }}
    >
      {children}
    </AppShell>
  )
}
