import { useMutation } from '@tanstack/react-query'

import { deleteStudioImage, uploadStudioImage } from '@/services/studioUploads.service'

export function useUploadStudioImage() {
  return useMutation({
    mutationFn: ({ token, image }: { token: string; image: Blob }) => uploadStudioImage(token, image),
  })
}

export function useDeleteStudioImage() {
  return useMutation({
    mutationFn: ({ token, url }: { token: string; url: string }) => deleteStudioImage(token, url),
  })
}
