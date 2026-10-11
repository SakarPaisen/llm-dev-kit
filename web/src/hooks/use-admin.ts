'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api, queryKeys } from '@/lib/api-client'
import type { Role } from '@/lib/roles'

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers(),
    queryFn: ({ signal }) => api.admin.users(signal),
  })
}

export function useSetRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.admin.setRole(userId, role),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() })
      toast.success(`${user.name ?? user.email} is now ${user.role === 'admin' ? 'an' : 'a'} ${user.role}`)
    },
    onError: (error: Error) => {
      toast.error('Could not change the role', { description: error.message })
    },
  })
}

export function useAdminHealth() {
  return useQuery({
    queryKey: queryKeys.adminHealth(),
    queryFn: ({ signal }) => api.admin.health(signal),
    refetchInterval: 30_000,
  })
}
