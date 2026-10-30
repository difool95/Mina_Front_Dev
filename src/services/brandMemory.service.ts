import { BRAND_MEMORY_MAX } from '@/lib/brandMemory'
import type { BrandMemory, BrandMemoryVars } from '@/types'

import { apiPost } from './api.client'
import { supabase } from './supabase.client'

/**
 * This user's brand memories, newest first. Only the ones the scanner read:
 * a memory whose scan failed stays as an `error` row and never shows.
 */
export async function getBrandMemories(userId: string) {
  const { data, error } = await supabase
    .from('mega_generations')
    .select('mg_id, mg_prompt, mg_mma_vars')
    .eq('mg_pass_id', `pass:user:${userId}`)
    .eq('mg_record_type', 'product')
    .eq('mg_status', 'done')
    // Highest sort_order first, so the newest memory leads the bar. Several added
    // together can share one sort_order; among those, the latest saved goes first.
    .order('mg_mma_vars->sort_order', { ascending: false })
    .order('mg_created_at', { ascending: false })
    .limit(BRAND_MEMORY_MAX)

  if (error) throw new Error(error.message)

  return (data ?? []) as BrandMemory[]
}

/** Asks the API to scan a picture already on R2 and save it as a new brand memory. */
export function createBrandMemory(token: string, url: string) {
  return apiPost<{ id: string }>('/api/brand-memories', token, { url })
}

/** Saves a memory's vars, its name going to `mg_prompt` as well. */
export async function updateBrandMemory(mgId: string, vars: BrandMemoryVars) {
  const { error } = await supabase
    .from('mega_generations')
    .update({ mg_mma_vars: vars, mg_prompt: vars.name, mg_updated_at: new Date().toISOString() })
    .eq('mg_id', mgId)

  if (error) throw new Error(error.message)
}

export async function deleteBrandMemory(mgId: string) {
  const { error } = await supabase.from('mega_generations').delete().eq('mg_id', mgId)

  if (error) throw new Error(error.message)
}
