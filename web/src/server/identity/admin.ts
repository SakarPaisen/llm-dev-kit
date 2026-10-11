import 'server-only'

import type { Prisma } from '@prisma/client'

import { db } from '@/lib/db'

type Client = Prisma.TransactionClient | typeof db

/**
 * Promote the earliest user to admin when no admin exists. Idempotent.
 *
 * Called inside the registration transaction (so the first account is an
 * admin the moment it exists), when an OAuth sign-in creates a user, and at
 * server start, which covers databases from before roles existed. Picking the
 * *earliest* user rather than "the one just created" means two concurrent
 * first sign-ups still end with exactly one admin.
 */
export async function ensureAdmin(client: Client = db): Promise<void> {
  const admin = await client.user.findFirst({ where: { role: 'admin' }, select: { id: true } })
  if (admin) return

  const first = await client.user.findFirst({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  })
  if (first) {
    await client.user.update({ where: { id: first.id }, data: { role: 'admin' } })
  }
}
