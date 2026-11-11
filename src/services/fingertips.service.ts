import { FINGERTIPS_PATHS } from '@/lib/studio'
import type { EditTool, FingertipsRequest, StillGenerationResult } from '@/types'

import { apiPost } from './api.client'

/**
 * Starts one of the right panel's edit tools on a picture. The API charges it,
 * writes the generation row and starts the edit, then answers
 * at once: the studio follows the generation as it does a Create's.
 */
export function startFingertips(token: string, tool: EditTool, body: FingertipsRequest) {
  // Several pictures (Vectorize All) go to the tool's "all" route, which answers `generationIds`, one per picture.
  const path = body.imageUrls ? `${FINGERTIPS_PATHS[tool]}-all` : FINGERTIPS_PATHS[tool]

  return apiPost<StillGenerationResult & { generationIds?: string[] }>(`/api/fingertips/${path}`, token, body)
}
