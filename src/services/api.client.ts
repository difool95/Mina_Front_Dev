import { env } from '@/config/env'

/**
 * Calls the Express API on the caller's behalf.
 *
 * The Supabase access token travels in the Authorization header rather than
 * the body because the API re-verifies it with Supabase — the browser is never
 * trusted to say which user it is. A `Blob` body goes up as its raw bytes,
 * anything else as JSON.
 */
async function apiRequest<T>(method: 'POST' | 'DELETE', path: string, token: string, body?: unknown): Promise<T> {
  const isBlob = body instanceof Blob
  const response = await fetch(`${env.VITE_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined && { 'Content-Type': isBlob ? body.type : 'application/json' }),
    },
    ...(body !== undefined && { body: isBlob ? body : JSON.stringify(body) }),
  })

  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)

  return response.json() as Promise<T>
}

export function apiPost<T>(path: string, token: string, body?: unknown) {
  return apiRequest<T>('POST', path, token, body)
}

export function apiDelete<T>(path: string, token: string, body?: unknown) {
  return apiRequest<T>('DELETE', path, token, body)
}
