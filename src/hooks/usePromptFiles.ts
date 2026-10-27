import { useMutation } from '@tanstack/react-query'

import { exportPromptFile, importPromptFile } from '@/services/promptFiles.service'

export function useExportPromptFile() {
  return useMutation({
    mutationFn: ({ token, generationId, filename }: { token: string; generationId: string; filename: string }) =>
      exportPromptFile(token, generationId, filename),
    onError: (error: unknown) => {
      console.error('Could not export the prompt file', error)
    },
  })
}

export function useImportPromptFile() {
  return useMutation({
    mutationFn: ({ token, file }: { token: string; file: File }) => importPromptFile(token, file),
  })
}
