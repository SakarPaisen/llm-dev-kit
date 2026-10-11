/** A personal API key as the owner sees it. The key itself is never listed. */
export interface ApiKeySummary {
  id: string
  name: string
  /** The first characters, e.g. `sk-ldk-AbCd`, to tell keys apart. */
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

/** Returned once, at creation: the only time the full key is visible. */
export interface CreatedApiKey extends ApiKeySummary {
  key: string
}
