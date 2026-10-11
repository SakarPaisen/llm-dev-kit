import 'server-only'

import { randomUUID } from 'node:crypto'

import { SignJWT } from 'jose'

import { db } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { asRole, SCOPES_BY_ROLE } from '@/lib/roles'
import { ApiError } from '@/server/http'
import { activeSigningKey } from '@/server/identity/keys'

/** Access tokens are short-lived, so a role change or a revoked key bites fast. */
export const ACCESS_TOKEN_SECONDS = 300

export interface AccessToken {
  token: string
  expiresIn: number
}

/**
 * Sign an access token for `userId`, the credential the Python services
 * verify (decision D2). The role is read from the database every time, never
 * from the session, so demoting a user takes effect within one token lifetime.
 *
 * @param via How the caller proved who they are; `api_key` is recorded in
 *   `amr` so the services can tell a script from a browser session.
 */
export async function mintAccessToken(
  userId: string,
  via: 'session' | 'api_key' = 'session',
): Promise<AccessToken> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
  if (!user) throw new ApiError('unauthorized', 'Sign in to continue')

  const role = asRole(user.role)
  const env = getEnv()
  const key = await activeSigningKey()

  const token = await new SignJWT({
    roles: [role],
    scope: SCOPES_BY_ROLE[role].join(' '),
    ...(via === 'api_key' ? { amr: ['api_key'] } : {}),
  })
    .setProtectedHeader({ alg: 'RS256', kid: key.kid, typ: 'JWT' })
    .setIssuer(env.IDENTITY_ISSUER)
    .setAudience(env.IDENTITY_AUDIENCE)
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_SECONDS}s`)
    .setJti(randomUUID())
    .sign(key.privateKey)

  return { token, expiresIn: ACCESS_TOKEN_SECONDS }
}
