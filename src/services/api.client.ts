import { env } from '@/config/env'

/**
 * Posts to the Express API on the caller's behalf.
 *
 * The Supabase access token travels in the Authorization header rather than
 * the body because the API re-verifies it with Supabase — the browser is never
 * trusted to say which user it is.
 */
export async function apiPost<T>(path: string, token: string, body?: unknown): Promise<T> {
  const response = await fetch(`${env.VITE_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)

  return response.json() as Promise<T>
}
