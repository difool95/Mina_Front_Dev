import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryKeys'
import { getSceneLibrary } from '@/services/sceneLibrary.service'

/** The scene library's pictures. Static for a session, so it never refetches. */
export function useSceneLibrary() {
  return useQuery({
    queryKey: queryKeys.sceneLibrary,
    queryFn: getSceneLibrary,
    staleTime: Infinity,
  })
}
