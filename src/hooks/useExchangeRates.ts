import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { getRatesFromGbp } from '@/services/rates.service'

/**
 * What a pound is worth in each currency Mina prices in.
 *
 * Held for an hour: rates move by fractions of a percent in that time, and a
 * price that changes while somebody is looking at it reads as a fault.
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: queryKeys.rates,
    queryFn: getRatesFromGbp,
    staleTime: 60 * 60 * 1000,
  })
}
