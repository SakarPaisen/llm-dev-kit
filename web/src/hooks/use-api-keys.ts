'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, queryKeys } from '@/lib/api-client'

export function useApiKeys(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.apiKeys(),
    queryFn: ({ signal }) => api.keys.list(signal),
    enabled,
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => api.keys.create(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys() })
    },
    onError: (error: Error) => {
      toast.error('Could not create the key', { description: error.message })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId: string) => api.keys.revoke(keyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys() })
      toast.success('Key revoked')
    },
    onError: (error: Error) => {
      toast.error('Could not revoke the key', { description: error.message })
    },
  })
}
