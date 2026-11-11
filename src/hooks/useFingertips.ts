import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { GENERATION_POLL_MS, hasEnded } from '@/lib/minaBrief'
import { queryKeys } from '@/lib/queryKeys'
import { startFingertips } from '@/services/fingertips.service'
import { getGenerationStatus } from '@/services/generations.service'
import type { EditTool, FingertipsRequest, MmaStatus } from '@/types'

/**
 * Starts an edit tool on a picture. The balance is fetched again once the API
 * has charged it; `useGenerationStatus` follows the edit from there.
 */
export function useStartFingertips(userId: string | undefined) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ token, tool, ...body }: FingertipsRequest & { token: string; tool: EditTool }) =>
      startFingertips(token, tool, body),
    onSuccess: () => void client.invalidateQueries({ queryKey: queryKeys.customer(userId ?? '') }),
  })
}

//This method is used to get the status of many generations at once. It is used to get the status of all the generations that are currently being processed by the server.
//It is used in the studio page to show the user the status of their generations.
export function useFingertipsStatuses(generationIds: string[], userId: string | undefined) {
  const client = useQueryClient()
  const statuses = useQueries({
    queries: generationIds.map((generationId) => ({
      queryKey: queryKeys.generationStatus(generationId),
      queryFn: () => getGenerationStatus(generationId),
      refetchInterval: (query: { state: { data?: { status: MmaStatus } } }) =>
        hasEnded(query.state.data?.status) ? false : GENERATION_POLL_MS,
    })),
  }).map((query) => query.data)

  // Once all have ended: the failed ones refunded their matcha, the done ones have their picture for the archive.
  const isOver = statuses.length > 0 && statuses.every((status) => hasEnded(status?.status))
  useEffect(() => {
    if (!isOver) return
    void client.invalidateQueries({ queryKey: queryKeys.customer(userId ?? '') })
    void client.invalidateQueries({ queryKey: queryKeys.generations(userId ?? '') })
  }, [client, isOver, userId])

  return statuses
}
