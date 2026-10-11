/**
 * Roles and the scopes they grant. The Python services enforce scopes
 * (ldk_core.auth); this table must match theirs.
 */
export const ROLES = ['viewer', 'user', 'admin'] as const

export type Role = (typeof ROLES)[number]

export const SCOPES_BY_ROLE: Record<Role, readonly string[]> = {
  viewer: ['chat'],
  user: ['chat', 'ingest'],
  admin: ['chat', 'ingest', 'admin'],
}

/** Narrow a stored role. Anything unrecognised gets the least access. */
export function asRole(value: string | null | undefined): Role {
  return (ROLES as readonly string[]).includes(value ?? '') ? (value as Role) : 'viewer'
}
