import 'server-only'

import { randomUUID } from 'node:crypto'

import { exportJWK, generateKeyPair, importJWK, type JWK } from 'jose'

import { db } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { open, seal } from '@/server/identity/secret-box'

/** A new signing key is created once the newest is this old. */
export const ROTATE_AFTER_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Keys stay published this long after creation: one rotation period plus a
 * day, so tokens signed just before a rotation stay verifiable (they live 5
 * minutes) and services that cached the old set refetch in time.
 */
const PUBLISH_FOR_MS = ROTATE_AFTER_MS + 24 * 60 * 60 * 1000

/** Rows older than this are deleted on rotation. */
const DELETE_AFTER_MS = 2 * ROTATE_AFTER_MS

const CACHE_MS = 60_000

export interface ActiveKey {
  kid: string
  privateKey: CryptoKey
  createdAt: Date
}

let active: { key: ActiveKey; expiresAt: number } | null = null

/** The key to sign with now, creating or rotating one when needed. */
export async function activeSigningKey(): Promise<ActiveKey> {
  const now = Date.now()
  if (active && active.expiresAt > now) return active.key

  const secret = getEnv().AUTH_SECRET
  const newest = await db.signingKey.findFirst({ orderBy: { createdAt: 'desc' } })

  let key: ActiveKey | null = null
  if (newest && now - newest.createdAt.getTime() < ROTATE_AFTER_MS) {
    const jwk = open(newest.privateJwk, secret)
    if (jwk) {
      key = {
        kid: newest.id,
        privateKey: (await importJWK(JSON.parse(jwk) as JWK, 'RS256')) as CryptoKey,
        createdAt: newest.createdAt,
      }
    }
    // Unreadable: AUTH_SECRET changed. Fall through and rotate.
  }

  key ??= await createSigningKey()
  active = { key, expiresAt: now + CACHE_MS }
  return key
}

/** Public keys for /.well-known/jwks.json. */
export async function publishedKeys(): Promise<JWK[]> {
  await activeSigningKey()
  const rows = await db.signingKey.findMany({
    where: { createdAt: { gt: new Date(Date.now() - PUBLISH_FOR_MS) } },
    orderBy: { createdAt: 'desc' },
    select: { publicJwk: true },
  })
  return rows.map((row) => JSON.parse(row.publicJwk) as JWK)
}

async function createSigningKey(): Promise<ActiveKey> {
  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  })
  const kid = randomUUID()
  const publicJwk = { ...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig' }
  const privateJwk = { ...(await exportJWK(privateKey)), kid, alg: 'RS256' }

  const row = await db.signingKey.create({
    data: {
      id: kid,
      publicJwk: JSON.stringify(publicJwk),
      privateJwk: seal(JSON.stringify(privateJwk), getEnv().AUTH_SECRET),
    },
  })
  await db.signingKey.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - DELETE_AFTER_MS) } },
  })
  return { kid, privateKey, createdAt: row.createdAt }
}

/** For tests: forget the cached key. */
export function resetSigningKeyCache(): void {
  active = null
}
