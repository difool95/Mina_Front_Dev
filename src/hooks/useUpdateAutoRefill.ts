import { useMutation, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { updateAutoRefillPreferences } from '@/services/customers.service'
import type { MmaPreferences } from '@/types/customer.types'

/** Saves the Auto Matcha Refill settings to the signed-in user's row. */
export function useUpdateAutoRefill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: MmaPreferences }) =>
      updateAutoRefillPreferences(userId, preferences),
    // The panel that opens next, and the profile's own toggle, both read
    // this same cached row — so the save has to invalidate it to be seen.
    onSuccess: (_result, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customer(userId) })
    },
  })
}
