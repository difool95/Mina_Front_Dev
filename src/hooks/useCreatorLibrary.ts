import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { getCreatorLibrary } from '@/services/creatorLibrary.service'

/** The creators library's active pictures. Static for a session, so it never refetches. */
export function useCreatorLibrary() {
  return useQuery({
    queryKey: queryKeys.creatorLibrary,
    queryFn: getCreatorLibrary,
    staleTime: Infinity,
  })
}
