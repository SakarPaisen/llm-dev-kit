import { NextResponse } from 'next/server'

import { requireUser, withErrorHandling } from '@/server/http'
import { revokeApiKey } from '@/server/identity/api-keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ keyId: string }> }

export const DELETE = withErrorHandling(async (_request: Request, context: RouteContext) => {
  const user = await requireUser()
  const { keyId } = await context.params
  await revokeApiKey(user.id, keyId)
  return new NextResponse(null, { status: 204 })
})
