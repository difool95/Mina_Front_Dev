import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import {
  copyLink,
  copyMediaToClipboard,
  deleteGeneration,
  downloadMedia,
  getGenerations,
  getLikedGenerationIds,
  likeGeneration,
  unlikeGeneration,
} from '@/services/generations.service'
import type { MegaGeneration } from '@/types/generation.types'

/** Everything the signed-in user has made. Skipped until there is a user. */
export function useGenerations(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.generations(userId ?? ''),
    queryFn: () => getGenerations(userId!),
    enabled: Boolean(userId),
  })
}

export function useDeleteGeneration(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: deleteGeneration,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.generations(userId ?? '') }),
  })
}

export function useDownloadMedia() {
  return useMutation({
    mutationFn: ({ url, filename }: { url: string; filename: string }) =>
      downloadMedia(url, filename),
    // Otherwise a blocked fetch fails with nothing on screen and nothing logged.
    onError: (error: unknown) => {
      console.error('Could not download the creation', error)
    },
  })
}

export function useCopyLink() {
  return useMutation({
    mutationFn: copyLink,
    onError: (error: unknown) => {
      console.error('Could not copy the link', error)
    },
  })
}

export function useCopyMedia() {
  return useMutation({
    mutationFn: copyMediaToClipboard,
    onError: (error: unknown) => {
      console.error('Could not copy the creation', error)
    },
  })
}

/**
 * Which creations this user has liked.
 *
 * One query for the whole archive rather than one per card — every panel reads
 * the same key, so React Query serves them all from a single fetch.
 */
export function useLikedGenerations(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.likes(userId ?? ''),
    queryFn: () => getLikedGenerationIds(userId!),
    enabled: Boolean(userId),
  })
}

export function useLikeGeneration(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (generation: MegaGeneration) => likeGeneration(generation, userId!),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.likes(userId ?? '') }),
    onError: (error: unknown) => {
      console.error('Could not like the creation', error)
    },
  })
}

export function useUnlikeGeneration(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (generationId: string) => unlikeGeneration(generationId, userId!),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.likes(userId ?? '') }),
    onError: (error: unknown) => {
      console.error('Could not remove the like', error)
    },
  })
}
