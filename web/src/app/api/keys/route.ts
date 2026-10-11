import { NextResponse } from 'next/server'

import { createApiKeySchema } from '@/lib/validations/api-key'
import { parseBody, requireUser, withErrorHandling } from '@/server/http'
import { createApiKey, listApiKeys } from '@/server/identity/api-keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async () => {
  const user = await requireUser()
  return NextResponse.json({ data: await listApiKeys(user.id) })
})

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser()
  const { name } = await parseBody(request, createApiKeySchema)
  return NextResponse.json(
    { data: await createApiKey(user.id, name) },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
})
