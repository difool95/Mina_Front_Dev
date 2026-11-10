import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { startFingertips } from '@/services/fingertips.service'
import type { EditTool, FingertipsRequest } from '@/types'

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
