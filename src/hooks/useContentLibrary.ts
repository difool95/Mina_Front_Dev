import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { getContentLibrary } from '@/services/contentLibrary.service'

/** The content library's active templates. Static for a session, so it never refetches. */
export function useContentLibrary() {
  return useQuery({
    queryKey: queryKeys.contentLibrary,
    queryFn: getContentLibrary,
    staleTime: Infinity,
  })
}
