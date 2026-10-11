import type { Role } from '@/lib/roles'

export interface AdminUser {
  id: string
  name: string | null
  email: string
  role: Role
  /** How they can sign in: "password", "github", "keycloak". */
  signIn: string[]
  createdAt: string
  chatCount: number
  apiKeyCount: number
}

export type CheckStatus = 'ok' | 'degraded' | 'down' | 'off'

export interface HealthCheck {
  name: string
  status: CheckStatus
  /** One line for the person reading the page. */
  detail: string
}

export interface AdminHealth {
  checkedAt: string
  checks: HealthCheck[]
  counts: { users: number; chats: number; apiKeys: number; indexedChunks: number | null }
}
