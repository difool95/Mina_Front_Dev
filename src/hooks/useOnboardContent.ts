import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { getOnboardContent } from '@/services/onboardContent.service'

/** Active `onboard_content` rows. Static for a session, so it never refetches. */
export function useOnboardContent() {
  return useQuery({
    queryKey: queryKeys.onboardContent,
    queryFn: getOnboardContent,
    staleTime: Infinity,
  })
}
