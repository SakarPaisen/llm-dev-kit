// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { rewritingFetch } from '@/lib/auth/rewriting-fetch'

const PUBLIC = 'http://localhost:8080/sso/realms/llm-dev-kit'
const INTERNAL = 'http://keycloak:8080/sso/realms/llm-dev-kit'

describe('rewritingFetch', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends issuer URLs to the internal address and leaves others alone', async () => {
    const seen: string[] = []
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      seen.push(input instanceof Request ? input.url : String(input))
      return new Response('{}')
    })
    const fetcher = rewritingFetch(PUBLIC, INTERNAL)

    await fetcher(`${PUBLIC}/.well-known/openid-configuration`)
    await fetcher(new Request(`${PUBLIC}/protocol/openid-connect/token`, { method: 'POST' }))
    await fetcher('http://localhost:8080/sso/realms/llm-dev-kitty/x')
    await fetcher('https://api.github.com/user')

    expect(seen).toEqual([
      `${INTERNAL}/.well-known/openid-configuration`,
      `${INTERNAL}/protocol/openid-connect/token`,
      'http://localhost:8080/sso/realms/llm-dev-kitty/x',
      'https://api.github.com/user',
    ])
  })
})
