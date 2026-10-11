import { z } from 'zod'

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, 'Give the key a name').max(64, 'Keep the name under 64 characters'),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
