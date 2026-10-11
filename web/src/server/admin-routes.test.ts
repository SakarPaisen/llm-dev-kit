/// <reference types="vite/client" />
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The exit criterion of #17: every admin API refuses non-admins on the
 * server. Route files are discovered, not listed, so a new admin route is
 * covered the moment it exists.
 */

const state = vi.hoisted(() => ({
  session: null as { user: { id: string; email: string } } | null,
  roles: { 'admin-1': 'admin', 'user-1': 'user', 'viewer-1': 'viewer' } as Record<string, string>,
}))

vi.mock('@/lib/auth', () => ({ auth: async () => state.session }))
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.roles[where.id] ? { role: state.roles[where.id] } : null,
    },
  },
}))

const service = vi.hoisted(() => ({
  listUsers: vi.fn(async () => []),
  setUserRole: vi.fn(async () => ({ id: 'user-1', role: 'viewer' })),
  getHealth: vi.fn(async () => ({ checks: [] })),
}))
vi.mock('@/server/services/admin-service', () => service)

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>

const routes = import.meta.glob<Record<string, unknown>>('/src/app/api/admin/**/route.ts', {
  eager: true,
})
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

const handlers = Object.entries(routes).flatMap(([file, module]) =>
  METHODS.filter((method) => typeof module[method] === 'function').map((method) => ({
    name: `${method} ${file.replace('/src/app', '').replace('/route.ts', '')}`,
    method,
    call: module[method] as Handler,
  })),
)

function invoke(handler: (typeof handlers)[number]) {
  const body = handler.method === 'GET' ? undefined : JSON.stringify({ role: 'viewer' })
  return handler.call(
    new Request('http://app.test/api/admin', {
      method: handler.method,
      ...(body ? { body, headers: { 'Content-Type': 'application/json' } } : {}),
    }),
    { params: Promise.resolve({ userId: 'user-1' }) },
  )
}

function signIn(id: string | null) {
  state.session = id ? { user: { id, email: `${id}@example.test` } } : null
}

beforeEach(() => {
  vi.clearAllMocks()
  signIn(null)
})

describe('admin API routes', () => {
  it('are discovered', () => {
    expect(handlers.map((h) => h.name).sort()).toEqual([
      'GET /api/admin/health',
      'GET /api/admin/users',
      'PATCH /api/admin/users/[userId]',
    ])
  })

  it.each(handlers.map((h) => [h.name, h] as const))('%s: 401 without a session', async (_, h) => {
    expect((await invoke(h)).status).toBe(401)
  })

  it.each(handlers.map((h) => [h.name, h] as const))(
    '%s: 403 for a user and a viewer, and nothing runs',
    async (_, h) => {
      for (const id of ['user-1', 'viewer-1']) {
        signIn(id)
        const res = await invoke(h)
        expect(res.status).toBe(403)
        expect(((await res.json()) as { error: { code: string } }).error.code).toBe('forbidden')
      }
      expect(service.listUsers).not.toHaveBeenCalled()
      expect(service.setUserRole).not.toHaveBeenCalled()
      expect(service.getHealth).not.toHaveBeenCalled()
    },
  )

  it.each(handlers.map((h) => [h.name, h] as const))('%s: allowed for an admin', async (_, h) => {
    signIn('admin-1')
    expect((await invoke(h)).status).toBe(200)
  })

  it('reads the role from the database, not the session', async () => {
    signIn('admin-1')
    state.roles['admin-1'] = 'user'
    const users = handlers.find((h) => h.name === 'GET /api/admin/users')!
    expect((await invoke(users)).status).toBe(403)
    state.roles['admin-1'] = 'admin'
  })
})
