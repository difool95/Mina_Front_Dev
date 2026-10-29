import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import {
  createBrandMemory,
  deleteBrandMemory,
  getBrandMemories,
  updateBrandMemory,
} from '@/services/brandMemory.service'
import { deleteStudioImage } from '@/services/studioUploads.service'
import type { BrandMemory, BrandMemoryVars } from '@/types'

/** The signed-in user's brand memories. Skipped until there is a user. */
export function useBrandMemories(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.brandMemories(userId ?? ''),
    queryFn: () => getBrandMemories(userId!),
    enabled: Boolean(userId),
  })
}

// Each write below refreshes the list once it succeeds, so the strip and the panel follow it.

export function useCreateBrandMemory(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ token, url }: { token: string; url: string }) => createBrandMemory(token, url),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.brandMemories(userId ?? '') }),
  })
}

export function useUpdateBrandMemory(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ mgId, vars }: { mgId: string; vars: BrandMemoryVars }) => updateBrandMemory(mgId, vars),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.brandMemories(userId ?? '') }),
  })
}

/** The row goes first, then its pictures leave R2 the way a removed studio picture does. */
export function useDeleteBrandMemory(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ token, memory }: { token: string; memory: BrandMemory }) => {
      await deleteBrandMemory(memory.mg_id)
      await Promise.all(memory.mg_mma_vars.images.map((url) => deleteStudioImage(token, url)))
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.brandMemories(userId ?? '') }),
  })
}
