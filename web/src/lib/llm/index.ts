import 'server-only'

import { getEnv } from '@/lib/env'
import { OpenAICompatibleProvider } from '@/lib/llm/openai-compatible'
import type { ChatProvider, ProviderModel } from '@/lib/llm/types'
import { mintAccessToken } from '@/server/identity/tokens'

let provider: ChatProvider | null = null

/** The single place the app decides which backend generates tokens. */
export function getChatProvider(): ChatProvider {
  if (!provider) {
    const env = getEnv()
    provider = new OpenAICompatibleProvider({
      baseUrl: env.LLM_BASE_URL,
      ...(env.LLM_API_KEY ? { apiKey: env.LLM_API_KEY } : {}),
      timeoutMs: env.LLM_REQUEST_TIMEOUT_MS,
    })
  }
  return provider
}

/**
 * The credential to call the model backend with on `userId`'s behalf: their
 * own short-lived access token, so rag-service and llm-service see who is
 * asking. A configured third-party key replaces it.
 */
export async function backendCredential(userId: string): Promise<string | undefined> {
  if (getEnv().LLM_API_KEY) return undefined
  return (await mintAccessToken(userId)).token
}

const MODEL_CACHE_TTL_MS = 60_000
let modelCache: { models: ProviderModel[]; expiresAt: number } | null = null

/**
 * The model list is small, changes rarely, and is requested on every page load.
 * A short TTL keeps the sidebar responsive without going stale after a pull.
 */
export async function getAvailableModels(userId: string): Promise<ProviderModel[]> {
  const now = Date.now()
  if (modelCache && modelCache.expiresAt > now) return modelCache.models

  const env = getEnv()
  try {
    const authorization = await backendCredential(userId)
    const models = await getChatProvider().listModels(authorization ? { authorization } : {})
    const resolved =
      models.length > 0 ? models : [fallbackModel(env.DEFAULT_MODEL)]
    modelCache = { models: resolved, expiresAt: now + MODEL_CACHE_TTL_MS }
    return resolved
  } catch {
    // Never block the UI on a model-list failure — the configured default is
    // still worth offering, and the send path reports its own errors.
    return [fallbackModel(env.DEFAULT_MODEL)]
  }
}

export function invalidateModelCache(): void {
  modelCache = null
}

function fallbackModel(id: string): ProviderModel {
  return { id, label: id, provider: 'local' }
}

export type { ChatProvider, ProviderModel } from '@/lib/llm/types'
export { ProviderError } from '@/lib/llm/types'
