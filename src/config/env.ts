import { z } from 'zod'

// The only place in src/ allowed to read import.meta.env. Parsing at module
// load means a missing key throws on boot instead of surfacing as `undefined`
// three screens deep.
export const env = z
  .object({
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
    VITE_API_BASE_URL: z.string().url().optional(),
    VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  })
  .parse(import.meta.env)
