import { NextResponse } from 'next/server'

import { publishedKeys } from '@/server/identity/keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The public keys access tokens are signed with. The Python services fetch
 * this to verify every caller; it holds no secrets.
 */
export async function GET() {
  return NextResponse.json(
    { keys: await publishedKeys() },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
