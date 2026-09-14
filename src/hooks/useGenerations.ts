import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import {
  deleteGeneration,
  downloadMedia,
  getGenerations,
} from '@/services/generations.service'

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
  })
}
