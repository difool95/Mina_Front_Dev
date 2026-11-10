import { FINGERTIPS_PATHS } from '@/lib/studio'
import type { EditTool, FingertipsRequest, StillGenerationResult } from '@/types'

import { apiPost } from './api.client'

/**
 * Starts one of the right panel's edit tools on a picture. The API charges the
 * lane's matchas, writes the generation row and starts the edit, then answers
 * at once: the studio follows the generation as it does a Create's.
 */
export function startFingertips(token: string, tool: EditTool, body: FingertipsRequest) {
  return apiPost<StillGenerationResult>(`/api/fingertips/${FINGERTIPS_PATHS[tool]}`, token, body)
}
