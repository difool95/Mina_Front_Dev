import type { PromptFileInputs } from '@/types'

import { apiPost } from './api.client'
import { saveBlob } from './generations.service'

/**
 * Downloads a generation's `.mina` prompt file. The API seals it with a key
 * only it holds, so the file can be shared but read only by Mina.
 */
export async function exportPromptFile(token: string, generationId: string, filename: string) {
  const { file } = await apiPost<{ file: string }>('/api/prompt-files/export', token, { generationId })

  saveBlob(new Blob([file], { type: 'application/octet-stream' }), filename)
}

/** What a dropped `.mina` file holds, unsealed by the API. */
export async function importPromptFile(token: string, file: File) {
  return apiPost<PromptFileInputs>('/api/prompt-files/import', token, { file: await file.text() })
}
