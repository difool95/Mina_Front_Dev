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
    mutationFn: ({ token, url, sortOrder }: { token: string; url: string; sortOrder: number }) =>
      createBrandMemory(token, url, sortOrder),
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

/**
 * Deletes one memory or several together, as a single mutation: it is pending
 * until the last one is gone. For each, the row goes first, then its pictures
 * leave R2 the way a removed studio picture does.
 *
 * The list refreshes once at the end, whether or not every delete worked, so
 * it shows what is really left.
 */
export function useDeleteBrandMemories(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ token, memories }: { token: string; memories: BrandMemory[] }) =>
      Promise.all(
        memories.map(async (memory) => {
          await deleteBrandMemory(memory.mg_id)
          await Promise.all(memory.mg_mma_vars.images.map((url) => deleteStudioImage(token, url)))
        }),
      ),
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.brandMemories(userId ?? '') }),
  })
}
