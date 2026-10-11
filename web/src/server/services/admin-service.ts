import 'server-only'

import { db } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { asRole, type Role } from '@/lib/roles'
import { ApiError, notFound } from '@/server/http'
import { mintAccessToken } from '@/server/identity/tokens'
import type { AdminHealth, AdminUser, HealthCheck } from '@/types/admin'

const CHECK_TIMEOUT_MS = 3_000

export async function listUsers(): Promise<AdminUser[]> {
  const rows = await db.user.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      createdAt: true,
      accounts: { select: { provider: true } },
      _count: { select: { chats: true, apiKeys: { where: { revokedAt: null } } } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: asRole(row.role),
    signIn: [...(row.passwordHash ? ['password'] : []), ...row.accounts.map((a) => a.provider)],
    createdAt: row.createdAt.toISOString(),
    chatCount: row._count.chats,
    apiKeyCount: row._count.apiKeys,
  }))
}

/**
 * Change a user's role. The instance always keeps at least one admin, so the
 * last one cannot be demoted, not even by themselves. Tokens already issued
 * keep their old role for at most five minutes; API keys follow at once.
 */
export async function setUserRole(userId: string, role: Role): Promise<AdminUser> {
  await db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!target) throw notFound('User')

    if (asRole(target.role) === 'admin' && role !== 'admin') {
      const admins = await tx.user.count({ where: { role: 'admin' } })
      if (admins <= 1) {
        throw new ApiError('conflict', 'There must be at least one admin; promote someone else first')
      }
    }
    await tx.user.update({ where: { id: userId }, data: { role } })
  })

  const updated = (await listUsers()).find((user) => user.id === userId)
  if (!updated) throw notFound('User')
  return updated
}

async function probe(url: string, init: RequestInit = {}): Promise<Response | null> {
  try {
    return await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    })
  } catch {
    return null
  }
}

/** What the admin page shows: each service's state and a few totals. */
export async function getHealth(adminId: string): Promise<AdminHealth> {
  const env = getEnv()
  const { token } = await mintAccessToken(adminId)
  const asAdmin = { headers: { Authorization: `Bearer ${token}` } }

  const [rag, llm, docs, cache, keycloak, counts, newestKey] = await Promise.all([
    probe(`${env.RAG_SERVICE_URL}/health`),
    probe(`${env.LLM_SERVICE_URL}/health`),
    probe(`${env.RAG_SERVICE_URL}/documents/stats`, asAdmin),
    probe(`${env.RAG_SERVICE_URL}/cache/stats`, asAdmin),
    env.AUTH_KEYCLOAK_ISSUER
      ? probe(
          `${(env.AUTH_KEYCLOAK_INTERNAL_ISSUER || env.AUTH_KEYCLOAK_ISSUER).replace(/\/$/, '')}/.well-known/openid-configuration`,
        )
      : Promise.resolve(undefined),
    Promise.all([
      db.user.count(),
      db.chat.count(),
      db.apiKey.count({ where: { revokedAt: null } }),
    ]),
    db.signingKey.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ])

  const [llmBody, docsBody, cacheBody] = await Promise.all([json(llm), json(docs), json(cache)])
  const [users, chats, apiKeys] = counts

  const checks: HealthCheck[] = [
    { name: 'Web app', status: 'ok', detail: 'Serving this page; database reachable' },
    reachable('RAG service', rag, 'Answering'),
    !llm
      ? { name: 'Model service', status: 'down', detail: 'Unreachable' }
      : llmBody?.['offline_ready'] === true
        ? { name: 'Model service', status: 'ok', detail: 'Ollama reachable; local models ready' }
        : {
            name: 'Model service',
            status: llm.ok ? 'degraded' : 'down',
            detail: 'Ollama unreachable or the embedding model is missing',
          },
    !docsBody
      ? { name: 'Document index', status: 'down', detail: unreadable(docs) }
      : docsBody['status'] === 'connected'
        ? { name: 'Document index', status: 'ok', detail: `${String(docsBody['document_count'])} chunks indexed` }
        : { name: 'Document index', status: 'down', detail: 'Vector store unreachable' },
    !cacheBody
      ? { name: 'Answer cache', status: 'down', detail: unreadable(cache) }
      : cacheBody['status'] === 'connected'
        ? { name: 'Answer cache', status: 'ok', detail: `${String(cacheBody['keys'] ?? 0)} cached answers` }
        : { name: 'Answer cache', status: 'degraded', detail: 'Redis unreachable; answers are not cached' },
    keycloak === undefined
      ? { name: 'Single sign-on', status: 'off', detail: 'Not configured' }
      : reachable('Single sign-on', keycloak, 'Keycloak answering'),
    signingKeyCheck(newestKey?.createdAt ?? null),
  ]

  return {
    checkedAt: new Date().toISOString(),
    checks,
    counts: {
      users,
      chats,
      apiKeys,
      indexedChunks:
        typeof docsBody?.['document_count'] === 'number' ? docsBody['document_count'] : null,
    },
  }
}

async function json(res: Response | null): Promise<Record<string, unknown> | null> {
  if (!res?.ok) return null
  return (await res.json().catch(() => null)) as Record<string, unknown> | null
}

function unreadable(res: Response | null): string {
  return res ? `Responded ${res.status}` : 'RAG service unreachable'
}

function reachable(name: string, res: Response | null, detail: string): HealthCheck {
  if (!res) return { name, status: 'down', detail: 'Unreachable' }
  if (!res.ok) return { name, status: 'down', detail: `Responded ${res.status}` }
  return { name, status: 'ok', detail }
}

const ROTATION_WARNING_DAYS = 35

function signingKeyCheck(createdAt: Date | null): HealthCheck {
  const name = 'Signing key'
  if (!createdAt) return { name, status: 'degraded', detail: 'None yet; one is made on first use' }
  const days = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)
  return days > ROTATION_WARNING_DAYS
    ? { name, status: 'degraded', detail: `${days} days old; rotation is overdue` }
    : { name, status: 'ok', detail: `${days} day${days === 1 ? '' : 's'} old; rotates every 30` }
}
