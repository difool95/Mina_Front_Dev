import { apiDelete, apiPost } from './api.client'

/** Puts a picture picked in the studio on R2, through the API, and returns its URL. */
export function uploadStudioImage(token: string, image: Blob) {
  return apiPost<{ url: string }>('/api/mma/uploads', token, image)
}

/** A picture from another site, such as a Shopify store's CDN, as a file to prepare and upload. */
export async function downloadPicture(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${url}`)

  return new File([await response.blob()], new URL(url).pathname.split('/').pop() || 'picture')
}

/** Deletes a picture the user removed from the studio. */
export function deleteStudioImage(token: string, url: string) {
  return apiDelete<{ ok: true }>('/api/mma/uploads', token, { url })
}
