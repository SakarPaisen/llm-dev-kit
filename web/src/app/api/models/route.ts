import { NextResponse } from 'next/server'

import { getAvailableModels } from '@/lib/llm'
import { getEnv } from '@/lib/env'
import { requireUser, withErrorHandling } from '@/server/http'

export const runtime = 'nodejs'

export const GET = withErrorHandling(async () => {
  const user = await requireUser()
  const models = await getAvailableModels(user.id)

  return NextResponse.json({
    data: models,
    meta: { defaultModel: getEnv().DEFAULT_MODEL },
  })
})
