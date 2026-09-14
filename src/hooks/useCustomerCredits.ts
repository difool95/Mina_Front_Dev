import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { getCustomerCredits } from '@/services/customers.service'

/** The matcha balance and its expiry, for the profile header. */
export function useCustomerCredits(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customer(userId ?? ''),
    queryFn: () => getCustomerCredits(userId!),
    enabled: Boolean(userId),
  })
}
