import { z } from 'zod'

import { ROLES } from '@/lib/roles'

export const updateUserSchema = z.object({
  role: z.enum(ROLES),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
