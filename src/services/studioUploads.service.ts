import { apiDelete, apiPost } from './api.client'

/** Puts a picture picked in the studio on R2, through the API, and returns its URL. */
export function uploadStudioImage(token: string, image: Blob) {
  return apiPost<{ url: string }>('/api/mma/uploads', token, image)
}

/** Deletes a picture the user removed from the studio. */
export function deleteStudioImage(token: string, url: string) {
  return apiDelete<{ ok: true }>('/api/mma/uploads', token, { url })
}
